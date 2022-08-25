/**
 * @fileoverview Parse raw Ideogram.js annotations from a TSV file
 */

import {camel} from './../lib';

export class TsvParser {

  constructor(tsv, ideo) {
    this.rawAnnots = this.parseTsv(tsv, ideo);
  }

  parseGenomicCoordinates(columns) {
    // These three columns (i.e. fields) are required
    const chr = columns[1];
    const start = parseInt(columns[2], 10);
    const length = parseInt(columns[3], 10);

    return [chr, start, length];
  }

  /**
  * Parses a TSV file, returns raw annotations
  */
  parseTsv(tsv, ideo) {
    const lines = tsv.split(/\r\n|\n/);

    const chrs = Object.keys(ideo.chromosomes[ideo.config.taxid]);

    const annots = [];

    for (let i = 0; i < chrs.length; i++) {
      const chr = chrs[i];
      annots.push({chr, annots: []});
    }

    let headers;
    const innerKeysByField = {};
    const customHeaders = [];

    const numRequired = 4;
    // let numColumns;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === '') continue; // Skip empty lines

      // Parse headers
      if (line[0] === '#') {
        if (line[1] === '#') {
          // Parse inner field keys in metainformation lines
          // E.g. ## differential_expression keys: gene;log2fc;pval_adj
          const keySplit = line.split(' keys: ');
          if (keySplit.length > 1) {
            const field = keySplit[0].slice(3);
            const keys = keySplit[1].split(';');
            innerKeysByField[camel(field)] = keys;
          }
        } else {
          console.log('parsing headers');
          // Slice/trim off "# ", take columns 5 and onward, e.g.:
          // full_name\tmentions\tdifferential_expression\tinterest_rank
          headers = line.slice(1).trim().split(/\t/).map(h => camel(h));
          // numColumns = headers.length;
          const customs = headers.slice(numRequired);
          customs.forEach((custom, i) => customHeaders.push(camel(custom)));
        }
        continue;
      }

      const columns = line.trim().split(/\t/);
      const name = columns[0];

      const [chr, start, length] = this.parseGenomicCoordinates(columns);
      const chrIndex = chrs.indexOf(chr);
      if (chrIndex === -1) continue;

      const customValues = columns.slice(numRequired);
      for (let j = 0; j < numRequired; j++) {
        const customHeader = customHeaders[j];
        if (customHeader in innerKeysByField) {
          const innerKeys = innerKeysByField[customHeader]
          const block = columns[numRequired + j];
          const group = block.split(';');
          const customValue = [];
          for (let k = 0; k < group.length; k++) {
            const innerObj = {};
            const innerValues = group[k].split('!');
            for (let m = 0; m < innerValues.length; m++) {
              const innerKey = innerKeys[m];
              const innerValue = innerValues[m];
              innerObj[camel(innerKey)] = innerValue;
            }
            customValue.push(innerObj);
          }
          customValues[j] = customValue;
        }
      }


      const annot = [name, chr, start, length].concat(customValues);

      annots[chrIndex].annots.push(annot);
    };

    const rawAnnots = {keys: headers, annots, innerKeysByField};
    return rawAnnots;
  }
}
