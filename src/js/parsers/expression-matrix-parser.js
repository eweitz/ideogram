/**
 * @fileoverview Parse raw Ideogram.js annotations from an expression matrix.
 * This module handles dense gene expression matrixes.
 * In gene expression expressions, rows are genes and columns are cells.
 */

export class ExpressionMatrixParser {

  /**
   * @param {String} matrix Tab-delimited gene expression matrix
   * @param {Object} coordinates Coordinates [chr, start, length] by gene name
   * @param {Object} ideo Ideogram object
   */
  constructor(matrix, ideo) {
    this.matrix = matrix;
    this.ideo = ideo;
  }

  /**
   * Initialize rawAnnots by fetching genomic coordinates, then merging them
   * with the gene expression matrix supplied in constructor.
   */
  setRawAnnots() {
    var parser, ideo, matrix;
    parser = this;
    ideo = this.ideo;
    matrix = this.matrix;

    return new Promise(function(resolve) {
      parser.rawAnnots = parser.fetchCoordinates(ideo)
        .then(function(coordinates) {
          parser.coordinates = coordinates;
          resolve(parser.parseExpressionMatrix(matrix, ideo));
        });
    });
  }

  /**
   * Get chromosome, start and stop coordinates from genome annotation file
   *
   * TODO: Support non-human organisms
   */
  fetchCoordinates(ideo) {
    var coordinates = {};

    if (ideo.config.organism === 'human') {
      var ensemblData =
        ideo.config.dataDir +
        '../../annotations/Homo_sapiens,_Ensembl_80.tsv';

      return new Promise(function(resolve) {
        ideo.fetch(ensemblData, 'text').then(function(data) {
          // eslint-disable-next-line no-unused-vars
          var tsvLines, i, start, stop, gene, chr, length;

          tsvLines = data.split(/\r\n|\n/).slice(1);
          for (i = 0; i < tsvLines.length; i++) {
            [start, stop, gene, , chr] = tsvLines[i].split(/\s/g);
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
    var annot, chrIndex, chr, start, gene, expressions,
      columns = tsvLine.split(/\s/g);

    gene = columns[0];
    if (gene in this.coordinates === false) return [null, null];

    expressions = columns.slice(1).map(d => parseFloat(d));
    [chr, start, length] = this.coordinates[gene];

    chrIndex = chrs.indexOf(chr);
    if (chrIndex === -1) return [null, null];

    annot = [gene, start, length];
    annot = annot.concat(expressions);

    return [chrIndex, annot];
  }

  /**
  * Parses a gene expression matrix file, returns raw annotations
  */
  parseExpressionMatrix(matrix, ideo) {
    var i, chrs, rawAnnots, cells, line, chrIndex, annot, keys,
      annots = [],
      tsvLines = matrix.split(/\r\n|\n/);

    chrs = Object.keys(ideo.chromosomes[ideo.config.taxid]);
    for (i = 0; i < chrs.length; i++) {
      annots.push({chr: chrs[i], annots: []});
    }

    for (i = 1; i < tsvLines.length; i++) {
      line = tsvLines[i];
      [chrIndex, annot] = this.parseAnnotFromTsvLine(line, chrs);
      if (chrIndex !== null) annots[chrIndex].annots.push(annot);
    }

    cells = tsvLines[0].split(/\s/g);
    keys = ['name', 'start', 'length'].concat(cells);
    rawAnnots = {keys: keys, annots: annots};

    return rawAnnots;
  }

}
