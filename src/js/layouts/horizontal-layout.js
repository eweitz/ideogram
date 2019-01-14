/**
* @fileoverview Horizontal layout class
* Ideogram instances with horizontal layout are oriented with each chromosome
* starting at left and ending at right, and aligned as rows.
*/

import {d3} from '../lib';
import Layout from './layout';

class HorizontalLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);
    this._class = 'HorizontalLayout';
    this.margin = {
      left: 20,
      top: 30
    };
  }

  _getLeftMargin() {
    var margin = Layout.prototype._getLeftMargin.call(this);
    if (this._config.ploidy > 1) {
      margin *= 1.8;
    }

    return margin;
  }

  rotateForward(setIndex, chrIndex, chrElement, callback) {

    var xOffset, yOffset, transform, labels;

    xOffset = 30;

    yOffset = xOffset + 7.5;

    transform = (
      'rotate(90) ' +
      'translate(' + xOffset + ', -' + yOffset + ') '
    );

    d3.select(chrElement.parentNode)
      .transition()
      .attr("transform", transform)
      .on('end', callback);

    // Append new chromosome labels
    labels = this.getChromosomeLabels(chrElement);
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
      .attr('x', xOffset - 4)
      .attr('y', function(d, i) {
        return (i + 1 + labels.length % 2) * 12;
      })
      .style('text-anchor', 'middle')
      .style('opacity', 0)
      .text(String)
      .transition()
      .style('opacity', 1);

    this._ideo.config.orientation = 'vertical';
  }

  rotateBack(setIndex, chrIndex, chrElement, callback) {
    var translate = this.getChromosomeSetTranslate(setIndex);

    d3.select(chrElement.parentNode)
      .transition()
      .attr("transform", translate)
      .on('end', callback);

    d3.selectAll(this._ideo.selector + ' g.tmp')
      .style('opacity', 0)
      .remove();

    this._ideo.config.orientation = 'horizontal';
  }

  getHeight(taxid) {
    // Get last chromosome set offset.
    var numChromosomes = this._config.chromosomes[taxid].length;
    var lastSetOffset = this.getChromosomeSetYTranslate(numChromosomes - 1);

    // Get last chromosome set size.
    var lastSetSize = this._getChromosomeSetSize(numChromosomes - 1);

    // Increase offset by last chromosome set size
    lastSetOffset += lastSetSize;

    return lastSetOffset + this._getAdditionalOffset() * 2;
  }

  getWidth() {
    return this._config.chrHeight + this.margin.top * 1.5;
  }

  getChromosomeSetLabelAnchor() {
    return 'end';
  }

  getChromosomeBandLabelAnchor() {
    return null;
  }

  getChromosomeBandTickY1() {
    return 2;
  }

  getChromosomeBandTickY2() {
    return 10;
  }

  getChromosomeSetLabelTranslate() {
    return null;
  }

  getChromosomeSetTranslate(setIndex) {
    var leftMargin = this._getLeftMargin();
    var yTranslate = this.getChromosomeSetYTranslate(setIndex);
    return 'translate(' + leftMargin + ', ' + yTranslate + ')';
  }

  getChromosomeSetYTranslate(setIndex) {
    // If no detailed description provided just use one formula for all cases.
    if (!this._config.ploidyDesc) {
      return this._config.chrMargin * (setIndex + 1);
    }

    // Id detailed description provided start to calculate offsets
    //  for each chromosome set separately. This should be done only once.
    if (!this._translate) {
      // First offset equals to zero.
      this._translate = [1];

      // Loop through description set
      for (var i = 1; i < this._config.ploidyDesc.length; i++) {
        this._translate[i] =
          this._translate[i - 1] + this._getChromosomeSetSize(i - 1);
      }
    }

    return this._translate[setIndex];
  }

  getChromosomeSetLabelXPosition(i) {
    if (this._config.ploidy === 1) {
      return this.getChromosomeLabelXPosition(i);
    } else {
      return -20;
    }
  }

  getChromosomeSetLabelYPosition(i) {
    var setSize = this._ploidy.getSetSize(i),
      config = this._config,
      chrMargin = config.chrMargin,
      chrWidth = config.chrWidth,
      y;

    if (config.ploidy === 1) {
      y = chrWidth / 2 + 3;
    } else {
      y = (setSize * chrMargin) / 2;
    }

    return y;
  }

  getChromosomeLabelXPosition() {
    return -8;
  }

  getChromosomeLabelYPosition() {
    return this._config.chrWidth;
  }

}

export default HorizontalLayout