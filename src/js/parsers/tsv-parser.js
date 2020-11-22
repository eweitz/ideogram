/**
 * @fileoverview Parse raw Ideogram.js annotations from a TSV file
 */

export class TsvParser {

  constructor(tsv, ideo) {
    this.rawAnnots = this.parseTsv(tsv, ideo);
  }

  parseGenomicCoordinates(columns) {
    var chr, start, stop, length;

    // These three columns (i.e. fields) are required
    chr = columns[1];
    start = parseInt(columns[2], 10);
    length = parseInt(columns[3], 10);

    stop = start + length;

    return [chr, start, stop, length];
  }

  /**
   * Parses an annotation from a tab-separated line of a TSV file
   */
  parseAnnotFromTsvLine(tsvLine, chrs) {
    var annot, chrIndex, chr, start, color, fullName, name,
      columns = tsvLine.split(/\t/g);

    [chr, start, stop, length] =
      this.parseGenomicCoordinates(columns);
    chrIndex = chrs.indexOf(chr);
    if (chrIndex === -1) return [null, null];

    name = columns[0];
    annot = [name, start, length, 0];

    if (columns.length >= 4) {
      color = columns[4];
      annot.push(color);
    }
    if (columns.length >= 5) {
      fullName = columns[5];
      annot.push(fullName);
    }

    return [chrIndex, annot];
  }

  parseRawAnnots(annots, tsvStartIndex, tsvLines, chrs) {
    var i, line, chrIndex, annot, keys, rawAnnots;

    for (i = tsvStartIndex; i < tsvLines.length; i++) {
      line = tsvLines[i];
      if (line.length === 0) continue; // Skip blank lines
      [chrIndex, annot] = this.parseAnnotFromTsvLine(line, chrs);
      if (chrIndex !== null) annots[chrIndex].annots.push(annot);
    }

    keys = ['name', 'start', 'length', 'trackIndex'];
    if (tsvLines[tsvStartIndex].length >= 4) keys.push('color');
    if (tsvLines[tsvStartIndex].length >= 5) keys.push('fullName');

    rawAnnots = {keys: keys, annots: annots};

    return rawAnnots;
  }

  /**
  * Parses a TSV file, returns raw annotations
  */
  parseTsv(tsv, ideo) {
    var i, chrs, chr, tsvStartIndex, rawAnnots,
      annots = [],
      tsvLines = tsv.split(/\r\n|\n/);

    chrs = Object.keys(ideo.chromosomes[ideo.config.taxid]);

    for (i = 0; i < chrs.length; i++) {
      chr = chrs[i];
      annots.push({chr: chr, annots: []});
    }

    tsvStartIndex = 0; // 1 if TSV has header (i.e. track line), 0 otherwise
    if (tsvLines[0].slice(0, 3) === 'chr' || isNaN(parseInt(tsvLines[0], 10))) {
      tsvStartIndex = 1;
    }

    rawAnnots = this.parseRawAnnots(annots, tsvStartIndex, tsvLines, chrs);
    return rawAnnots;
  }

}
