/**
 * @fileoverview Parse raw Ideogram.js annotations from a BED file
 * BED documentation: https://genome.ucsc.edu/FAQ/FAQformat#format1
 */

export class BedParser {

  constructor(bed, ideo) {
    this.rawAnnots = this.parseBed(bed, ideo);
  }

  // http://stackoverflow.com/a/5624139
  static componentToHex(c) {
    var hex = parseInt(c, 10).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  static rgbToHex(r, g, b) {
    return (
      "#" +
      BedParser.componentToHex(r) +
      BedParser.componentToHex(g) +
      BedParser.componentToHex(b)
    );
  }

  parseGenomicCoordinates(columns, ucscStyle) {
    var chr, start, stop, length;

    // These three columns (i.e. fields) are required
    chr = columns[0];
    start = parseInt(columns[1], 10);
    stop = parseInt(columns[2], 10);

    length = stop - start;

    if (ucscStyle) {
      chr = chr.slice(3);
    }

    return [chr, start, stop, length];
  }

  /**
   * Parses an annotation from a tab-separated line of a BED file
   */
  parseAnnotFromTsvLine(tsvLine, chrs, ucscStyle) {
    var annot, chrIndex, chr, start, rgb, color, label,
      columns = tsvLine.split(/\s/g);

    [chr, start, stop, length] =
      this.parseGenomicCoordinates(columns, ucscStyle);

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

  parseRawAnnots(annots, bedStartIndex, tsvLines, chrs) {
    var i, line, chrIndex, annot, keys, rawAnnots, ucscStyle;

    ucscStyle = true;
    if (isNaN(parseInt(tsvLines[bedStartIndex], 10)) === false) {
      ucscStyle = false;
    }

    for (i = bedStartIndex; i < tsvLines.length; i++) {
      line = tsvLines[i];
      [chrIndex, annot] = this.parseAnnotFromTsvLine(line, chrs, ucscStyle);
      if (chrIndex !== null) annots[chrIndex].annots.push(annot);
    }

    keys = ['name', 'start', 'length', 'trackIndex'];
    if (tsvLines[bedStartIndex].length >= 8) keys.push('color');

    rawAnnots = {keys: keys, annots: annots};

    return rawAnnots;
  }

  /**
  * Parses a BED file, returns raw annotations
  */
  parseBed(bed, ideo) {
    var i, chrs, chr, bedStartIndex, rawAnnots,
      annots = [],
      tsvLines = bed.split(/\r\n|\n/);

    chrs = Object.keys(ideo.chromosomes[ideo.config.taxid]);

    for (i = 0; i < chrs.length; i++) {
      chr = chrs[i];
      annots.push({chr: chr, annots: []});
    }

    bedStartIndex = 0; // 1 if BED has header (i.e. track line), 0 otherwise
    if (tsvLines[0].slice(0, 3) === 'chr' || isNaN(parseInt(tsvLines[0], 10))) {
      bedStartIndex = 1;
    }

    rawAnnots = this.parseRawAnnots(annots, bedStartIndex, tsvLines, chrs);
    return rawAnnots;
  }

}
