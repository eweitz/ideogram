/**
 * @fileoverview Parse raw Ideogram.js annotations from an expression matrix.
 * This module handles dense gene expression matrixes.
 */
import {d3} from '../lib';

export class ExpressionMatrixParser {

  /**
   * 
   * @param {String} matrix Tab-delimited gene expression matrix
   * @param {Object} coordinates Coordinates [chr, start, length] by gene name
   * @param {Object} ideo Ideogram object
   */
  constructor(matrix, ideo) {
    this.coordinates = this.fetchCoordinates(ideo);
    this.rawAnnots = this.parseExpressionMatrix(matrix, ideo);
  }

  fetchCoordinates(ideo) {
    var coordinates = {};

    if (ideo.config.organism === 'human') {
      var ensemblData = 
        ideo.config.dataDir + 
        '../../annotations/Homo_sapiens,_Ensembl_80.tsv';

      return new Promise(function(resolve) {
        d3.text(ensemblData).then(function(data) {
          var tsvLines, i, start, stop, gene, geneType, chr, length;
          
          tsvLines = data.split(/\r\n|\n/).slice(1,);
          for (i  = 1; i < tsvLines.length; i++) {
            [start, stop, gene, geneType, chr] = tsvLines[i];
            start = parseInt(start);
            stop = parseInt(stop);
            length = stop - start;
            coordinates[gene] = [chr, start, length];
          }
          resolve(coordinates);
        });
      });
    } else {
      throw Error('Expression matrix parsing is only supported for human');
    }
  }

  /**
   * Parses an annotation from a tab-separated line of a matrix file
   */
  parseAnnotFromTsvLine(tsvLine, chrs) {
    var annot, chrIndex, chr, start, rgb, color, label,
      columns = tsvLine.split(/\s/g);

    gene = columns[0];
    expressions = columns.slice(1,);
    
    [chr, start, length] = this.coordinates[gene];

    chrIndex = chrs.indexOf(chr);
    if (chrIndex === -1) return [null, null];
    
    annot = ['', start, length, 0];

    if (columns.length >= 4) {
      label = columns[3];
      annot[0] = label;
    }

    if (columns.length >= 8) {
      rgb = columns[8].split(',');
      color = BedParser.rgbToHex(rgb[0], rgb[1], rgb[2]);
      annot.push(color);
    }

    return [chrIndex, annot];
  }

  parseRawAnnots(annots, tsvLines, chrs) {
    var i, line, chrIndex, annot, keys, rawAnnots;

    for (i = 0; i < tsvLines.length; i++) {
      line = tsvLines[i];
      [chrIndex, annot] = this.parseAnnotFromTsvLine(line, chrs);
      if (chrIndex !== null) annots[chrIndex].annots.push(annot);
    }

    keys = ['name', 'start', 'length', 'trackIndex'];
    if (tsvLines[0].length >= 8) keys.push('color');
    
    rawAnnots = {keys: keys, annots: annots};

    return rawAnnots;
  }

  /**
  * Parses a gene expression matrix file, returns raw annotations
  */
  parseExpressionMatrix(matrix, ideo) {
    var i, chrs, chr, bedStartIndex, rawAnnots,
      annots = [],
      tsvLines = matrix.split(/\r\n|\n/);

    chrs = Object.keys(ideo.chromosomes[ideo.config.taxid]);

    for (i = 0; i < chrs.length; i++) {
      chr = chrs[i];
      annots.push({chr: chr, annots: []});
    }

    rawAnnots = this.parseRawAnnots(annots, tsvLines, chrs);
    return rawAnnots;
  }

}
