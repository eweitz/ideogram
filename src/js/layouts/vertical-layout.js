/**
* @fileoverview Vertical layout class
* Ideogram instances with vertical layout are oriented with each chromosome
* starting at top and ending at bottom, and aligned as columns.
*/


import {d3} from '../lib';
import Layout from './layout';

class VerticalLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);
    this._class = 'VerticalLayout';
    // Layout margins
    this.margin = {
      top: 30,
      left: 15
    };
  }

  rotateForward(setIndex, chrIndex, chrElement, callback) {

    var self = this;

    var xOffset = 20;

    var scale = this.getChromosomeScale(chrElement);

    var transform =
      'translate(' + xOffset + ', 25) ' + scale;

    d3.select(chrElement.parentNode)
      .transition()
      .attr('transform', transform)
      .on('end', callback);

    // Append new chromosome labels
    var labels = this.getChromosomeLabels(chrElement);
    var y = (xOffset + self._config.chrWidth) * 1.3;
    d3.select(this._ideo.getSvg())
      .append('g')
      .attr('class', 'tmp')
      .selectAll('text')
      .data(labels)
      .enter()
      .append('text')
      .attr('class', function(d, i) {
        return i === 0 && labels.length === 2 ? 'chrSetLabel' : null;
      })
      .attr('x', 0)
      .attr('y', y).style('opacity', 0)
      .text(String)
      .transition()
      .style('opacity', 1);

    this._ideo.config.orientation = 'horizontal';
  }

  rotateBack(setIndex, chrIndex, chrElement, callback) {

    var scale = this.getChromosomeScaleBack(chrElement);
    var translate = this.getChromosomeSetTranslate(setIndex);

    d3.select(chrElement.parentNode)
      .transition()
      .attr('transform', translate + ' ' + scale)
      .on('end', callback);

    d3.selectAll(this._ideo.selector + ' g.tmp')
      .style('opacity', 0)
      .remove();

    this._ideo.config.orientation = 'vertical';
  }

  getHeight() {
    return this._config.chrHeight + this.margin.top * 1.5;
  }

  getWidth() {
    return '97%';
  }

  getChromosomeBandTickY1() {
    return 2;
  }

  getChromosomeBandTickY2() {
    return 10;
  }

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  }

  getChromosomeBandLabelAnchor() {
    return null;
  }

  getChromosomeScale(chrElement) {
    var ideoBox, chrBox, scaleX, scaleY;

    ideoBox = d3.select(this._ideo.selector).node().getBoundingClientRect();
    chrBox = chrElement.getBoundingClientRect();

    scaleX = (ideoBox.width / chrBox.height) * 0.97;
    scaleY = this._getYScale();

    return 'scale(' + scaleX + ', ' + scaleY + ')';
  }

  getChromosomeScaleBack(chrElement) {
    var scale, scaleX, scaleY, chrName, chrModel, taxid, ideo, config;

    ideo = this._ideo;
    config = ideo.config;
    taxid = config.taxid;

    chrName = chrElement.id.split('-')[0].replace('chr', '');
    chrModel = this._ideo.chromosomes[taxid][chrName];
    scaleX = (chrModel.oldWidth/(config.chrHeight*3)) * 0.97;
    scaleY = 1/this._getYScale();
    scale = 'scale(' + scaleX + ', ' + scaleY + ')';
    return scale;
  }

  getChromosomeSetTranslate(setIndex) {
    var marginTop = this.margin.top;
    var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setIndex);
    return (
      'rotate(90) ' +
      'translate(' + marginTop + ', -' + chromosomeSetYTranslate + ')'
    );
  }

  getChromosomeSetYTranslate(setIndex) {
    // Get additional padding caused by annotation/histogram tracks
    var pad = this._getAdditionalOffset(),
      margin = this._config.chrMargin,
      width = this._config.chrWidth,
      translate;

    // If no detailed description provided just use one formula for all cases
    if (!this._config.ploidyDesc) {
      // TODO:
      // This part of code contains a lot magic numbers and if
      // statements for exactly corresponing to original ideogram examples.
      // But all this stuff should be removed. Calculation of translate
      // should be a simple formula applied for all cases listed below.
      // Now they are diffirent because of Layout:_getAdditionalOffset do
      // not meet for cases when no annotation, when annotation exists and
      // when histogram used

      if (this._config.annotationsLayout === 'histogram') {
        var barWidth = this._ideo.config.barWidth;
        return margin / 2 + setIndex * (margin + width + 2) + pad * 2 + 1 + barWidth * 2;
      } else {
        translate = width + setIndex * (margin + width) + pad * 2;
        if (pad > 0) {
          return translate;
        } else {
          return translate + 4 + (2 * setIndex);
        }
      }
    }

    // If detailed description provided start to calculate offsets
    // for each chromosome set separately. This should be done only once
    if (!this._translate) {
      // First offset equals to zero
      this._translate = [this._ploidy.getSetSize(0) * width * 2];
      var prevTranslate;
      // Loop through description set
      for (var i = 1; i < this._config.ploidyDesc.length; i++) {
        prevTranslate = this._translate[i - 1];
        this._translate[i] = prevTranslate + this._getChromosomeSetSize(i - 1);
      }
    }

    return this._translate[setIndex];
  }

  getChromosomeSetLabelXPosition() {
    return (this._config.chrWidth * this._config.ploidy) / -2;
  }

  getChromosomeLabelXPosition() {
    return this._config.chrWidth / -2;
  }
}

export default VerticalLayout