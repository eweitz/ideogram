/**
* Vertical layout class
* Ideogram instances with vertical layout are oriented with each chromosome
* starting at top and ending at bottom, and aligned as columns.
*/

import d3 from 'd3';

export class VerticalLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);
    this._class = 'VerticalLayout';
      // Layout margins
    this._margin = {
      top: 30,
      left: 15
    };
  }

  rotateForward(setNumber, chrNumber, chrElement, callback) {
    var self = this;

    var xOffset = 20;

    var ideoBox = d3.select(this._ideo.selector).node().getBoundingClientRect();
    var chrBox = chrElement.getBoundingClientRect();

    var scaleX = (ideoBox.width / chrBox.height) * 0.97;
    var scaleY = this._getYScale();

    var transform =
      "translate(" + xOffset + ", 25) scale(" + scaleX + ", " + scaleY + ")";

    d3.select(chrElement.parentNode)
          .transition()
          .attr("transform", transform)
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
  };

  rotateBack(setNumber, chrNumber,
    chrElement, callback) {
    var translate = this.getChromosomeSetTranslate(setNumber);

    d3.select(chrElement.parentNode)
          .transition()
          .attr("transform", translate)
          .on('end', callback);

    d3.selectAll(this._ideo.selector + ' g.tmp')
          .style('opacity', 0)
          .remove();
  };

  getHeight() {
    return this._config.chrHeight + this._margin.top * 1.5;
  };

  getWidth() {
    return '97%';
  };

  getChromosomeBandLabelTranslate() {

  };

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  };

  getChromosomeSetTranslate(setNumber) {
    var marginTop = this._margin.top;
    var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setNumber);
    return (
      'rotate(90) ' +
      'translate(' + marginTop + ', -' + chromosomeSetYTranslate + ')'
    );
  };

  getChromosomeSetYTranslate(setNumber) {
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

      if (this._config.annotationsLayout === "histogram") {
        return margin / 2 + setNumber * (margin + width + 2) + pad * 2 + 1;
      } else {
        translate = width + setNumber * (margin + width) + pad * 2;
        if (pad > 0) {
          return translate;
        } else {
          return translate + 4 + (2 * setNumber);
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

    return this._translate[setNumber];
  };

  getChromosomeSetLabelXPosition() {
    return (this._config.chrWidth * this._config.ploidy) / -2;
  };

  getChromosomeLabelXPosition() {
    return this._config.chrWidth / -2;
  };
}
