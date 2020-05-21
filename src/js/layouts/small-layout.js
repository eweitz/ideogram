import Layout from './layout';

class SmallLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);

    this._class = 'SmallLayout';

    this.margin = {
      left: 36.5,
      top: 10
    };

    var taxid = this._ideo.getTaxid(this._ideo.config.organism);

    this.chrs = config.chromosomes[taxid];
    var numChrs = this.chrs.length;

    // Number of chromosomes per row
    this.chrsPerRow = Math.ceil(numChrs / config.rows);
  }

  // rotateForward(setIndex, chrIndex, chrElement, callback) {
  //   var ideoBox =
  //      d3.select(this._ideo.selector).node().getBoundingClientRect();
  //   var chrBox = chrElement.getBoundingClientRect();
  //
  //   var scaleX = (ideoBox.width / chrBox.height) * 0.97;
  //   var scaleY = this._getYScale();
  //
  //   transform = 'translate(5, 25) scale(' + scaleX + ', ' + scaleY + ')';
  //
  //   d3.select(chrElement.parentNode)
  //     .transition()
  //     .attr('transform', transform)
  //     .on('end', callback);
  // }
  //
  // rotateBack(setIndex, chrIndex, chrElement, callback) {
  //   var translate = this.getChromosomeSetTranslate(setIndex);
  //
  //   d3.select(chrElement.parentNode)
  //     .transition()
  //     .attr('transform', translate)
  //     .on('end', callback);
  // }

  /**
   * eweitz 2020-04-13:
   * This height metric is crude because it is calculated before
   * the height ("width") of each chromosome is calculated.
   *
   * It calculates height by multiplying the max height of all chromosomes
   * (specified in the Ideogram configuration object) by the number of rows.
   * This ensures the ideogram height doesn't truncate in cases like dog
   * (where chrX on the second row is longer than chr1 on the first), but it
   * often leaves too much space on the second row, e.g. for human.
   *
   * Ideally, ideogram height would be cumulative height per row, plus top
   * margin.  This would require calling getHeight _after_ all chromosomes
   * have had their height (technically, chr.width) assigned.  See draft new
   * getHeight method below this getHeight method.
  */
  getHeight() {
    var config = this._config;
    var chrHeight = config.chrHeight * 1.25;
    return this._config.rows * (chrHeight + this.margin.top);
  }

  /**
   * eweitz 2020-04-13:
   * Draft refinement of getHeight.  See note in classic version above.
   *
   * Total height is cumulative height per row, plus top margin
   */
  // getHeight() {
  //   let height = 0;
  //   const rows = this._config.rows;
  //   const chrEntries = Object.entries(this.chrs);

  //   for (let i = 0; i < rows; i++) {
  //     let rowHeight = 0;
  //     // Starting and ending indexes of chromosomes of this row
  //     const startIndex = this.chrsPerRow * i;
  //     const endIndex = this.chrsPerRow * (i + 1) - 1;

  //     for (let j = startIndex; j < endIndex; j++) {
  //       const thisChrHeight = chrEntries[j][1].width;
  //       if (thisChrHeight > rowHeight) {
  //         rowHeight = thisChrHeight;
  //       }
  //     }
  //     height += rowHeight + this.margin.top;
  //   }

  //   return height;
  // }

  getWidth() {
    return '97%';
  }

  getChromosomeBandLabelTranslate() {

  }

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  }

  getChromosomeSetTranslate(setIndex) {
    var xOffset, yOffset;

    if (setIndex > this.chrsPerRow - 1) {
      xOffset = this.margin.left + this._config.chrHeight * 1.3;
      yOffset = this.getChromosomeSetYTranslate(setIndex - this.chrsPerRow);
    } else {
      xOffset = this.margin.left;
      yOffset = this.getChromosomeSetYTranslate(setIndex);
    }

    return 'rotate(90) translate(' + xOffset + ', -' + yOffset + ')';
  }

  getChromosomeSetYTranslate(setIndex) {
    // Get additional padding caused by annotation tracks
    var additionalPadding = this._getAdditionalOffset();
    // If no detailed description provided just use one formula for all cases
    return (
      this.margin.left * (setIndex) + this._config.chrWidth +
      additionalPadding * 2 + additionalPadding * setIndex
    );
  }

  getChromosomeSetLabelXPosition(setIndex) {
    return (
      ((this._ploidy.getSetSize(setIndex) * this._config.chrWidth + 20) / -2) +
      (this._config.ploidy > 1 ? 0 : this._config.chrWidth)
    );
  }

  getChromosomeLabelXPosition() {
    return this._config.chrWidth / -2;
  }

}

export default SmallLayout;
