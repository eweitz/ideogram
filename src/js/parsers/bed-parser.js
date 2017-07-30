export class BedParser {

  constructor(bed, ideo) {
    this.rawAnnots = this.parseBed(bed, ideo);
  }

  // http://stackoverflow.com/a/5624139
  static componentToHex(c) {
    var hex = parseInt(c, 10).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  static rgbToHex(r, g, b) {
    return (
      "#" +
      BedParser.componentToHex(r) +
      BedParser.componentToHex(g) +
      BedParser.componentToHex(b)
    );
  }

  /*
  * Parses a BED file, returns raw annotations
  * BED documentation: https://genome.ucsc.edu/FAQ/FAQformat#format1
  */
  parseBed(bed, ideo) {

    var tsvLines, i, columns, chrs, chr, start, stop, chrIndex, annots, annot,
      chrs, annots, bedStartIndex, ucscStyle, rgb, color, label, keys,
      rawAnnots;

    annots = [];

    chrs = Object.keys(ideo.chromosomes[ideo.config.taxid]);

    for (i = 0; i < chrs.length; i++) {
      chr = chrs[i];
      annots.push({"chr": chr, "annots": []});
    }

    tsvLines = bed.split(/\r\n|\n/);

    bedStartIndex = 0; // 1 if BED has header (i.e. track line), 0 otherwise
    ucscStyle = true;
    if (tsvLines[0].slice(0,3) === 'chr' || isNaN(parseInt(tsvLines[0]))) {
      bedStartIndex = 1;
    }

    if (isNaN(parseInt(tsvLines[bedStartIndex])) === false) {
      ucscStyle = false;
    }

    for (i = bedStartIndex; i < tsvLines.length; i++) {
      columns = tsvLines[i].split(/\s/g);

      // These three columns (i.e. fields) are required
      chr = columns[0];
      start = parseInt(columns[1], 10);
      stop = parseInt(columns[2], 10);

      length = stop - start;

      if (ucscStyle) {
        chr = chr.slice(3);
      }
      chrIndex = chrs.indexOf(chr);
      if (chrIndex === -1) {
        continue;
      }
      annot = ["", start, length, 0];

      if (columns.length >= 4) {
        label = columns[3];
        annot[0] = label;
      }

      if (columns.length >= 8) {
        rgb = columns[8].split(',');
        color = Ideogram.rgbToHex(rgb[0], rgb[1], rgb[2]);
        annot.push(color)
      }

      annots[chrIndex]["annots"].push(annot);
    }
    keys = ['name', 'start', 'length', 'trackIndex'];
    if (tsvLines[bedStartIndex].length >= 8) {
      keys.push('color');
    }
    rawAnnots = {
      keys: keys,
      annots: annots
    };
    return rawAnnots;
  }

}