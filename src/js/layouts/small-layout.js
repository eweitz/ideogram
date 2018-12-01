import * as d3selection from 'd3-selection';

import Layout from './layout';
import {Object} from './../lib.js';

var d3 = Object.assign({}, d3selection);

class SmallLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);

    this._class = 'SmallLayout';

    this.margin = {
      left: 36.5,
      top: 10
    };
  }

  // rotateForward(setIndex, chrIndex, chrElement, callback) {
  //   var ideoBox = d3.select(this._ideo.selector).node().getBoundingClientRect();
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

  getHeight() {
    var chrHeight = this._config.chrHeight;
    return this._config.rows * (chrHeight + this.margin.top * 1.5);
  }

  getWidth() {
    return '97%';
  }

  getChromosomeBandLabelTranslate() {

  }

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  }

  getChromosomeSetTranslate(setIndex) {
    // Get organisms id list
    var organisms = [];
    this._ideo.getTaxids(function(taxidList) {
      organisms = taxidList;
    });
    // Get first organism chromosomes amount
    var size = this._ideo.config.chromosomes[organisms[0]].length;
    // Amount of chromosomes per number
    var rowSize = size / this._config.rows;

    var xOffset;
    var yOffset;

    if (setIndex > rowSize - 1) {
      xOffset = this.margin.left + this._config.chrHeight * 1.4;
      yOffset = this.getChromosomeSetYTranslate(setIndex - rowSize);
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

export default SmallLayout