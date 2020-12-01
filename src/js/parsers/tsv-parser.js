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

  /** If value has substring match in headers, return column index */
  getValueColumnIndex(value, headerLine) {
    let index;
    headerLine.split(/\t/g).forEach((header, i) => {
      if (header.includes(value)) index = i;
    });
    return index;
  }

  /**
   * Parses an annotation from a tab-separated line of a TSV file
   */
  parseAnnotFromTsvLine(tsvLine, headerLine, chrs) {
    var annot, chrIndex, chr, start, color, fullName, significance, citations,
      name, index,
      columns = tsvLine.split(/\t/g);

    [chr, start, stop, length] =
      this.parseGenomicCoordinates(columns);
    chrIndex = chrs.indexOf(chr);
    if (chrIndex === -1) return [null, null];

    name = columns[0];
    annot = [name, start, length, 0];

    if (headerLine.includes('color')) {
      index = this.getValueColumnIndex('color', headerLine);
      color = columns[index];
      annot.push(color);
    }
    if (headerLine.includes('full_name')) {
      index = this.getValueColumnIndex('full_name', headerLine);
      fullName = columns[index];
      annot.push(fullName);
    }
    if (headerLine.includes('citations')) {
      index = this.getValueColumnIndex('citations', headerLine);
      citations = columns[index];
      annot.push(citations);
    }
    if (headerLine.includes('significance')) {
      index = this.getValueColumnIndex('significance', headerLine);
      significance = columns[index];
      annot.push(significance);
    }

    return [chrIndex, annot];
  }

  parseRawAnnots(annots, tsvStartIndex, tsvLines, chrs) {
    var i, line, chrIndex, annot, keys, rawAnnots;

    const headerLine = tsvLines[0];

    for (i = tsvStartIndex; i < tsvLines.length; i++) {
      line = tsvLines[i];
      if (line.length === 0) continue; // Skip blank lines
      [chrIndex, annot] = this.parseAnnotFromTsvLine(line, headerLine, chrs);
      if (chrIndex !== null) annots[chrIndex].annots.push(annot);
    }

    keys = ['name', 'start', 'length', 'trackIndex'];
    if (headerLine.includes('color')) keys.push('color');
    if (headerLine.includes('full_name')) keys.push('fullName');
    if (headerLine.includes('citations')) keys.push('citations');
    if (headerLine.includes('significance')) keys.push('significance');

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

    if (tsvStartIndex === 1 && tsvLines[0].includes('citations')) {
      // TSV has a header, so parse citation_from_<start_date>_to_<end_date>
      const headers = tsvLines[0].split('\t');
      const citeIndex = 6;
      const citeHeader = headers[citeIndex];
      const fromTo = citeHeader.split('citations_')[1];
      rawAnnots.annots = rawAnnots.annots.map((annotsByChr) => {
        annotsByChr.annots = annotsByChr.annots.map((annot) => {
          annot[citeIndex] =
            annot[citeIndex] + ' citations ' + fromTo.replace(/_/g, ' ');
          return annot;
        });
        return annotsByChr;
      });
    }

    return rawAnnots;
  }

}
