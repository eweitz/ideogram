/**
* @fileoverview Paired layout class
* Ideograms with paired layout group each chromosome in a chromosome set.
* This enables ploidy support beyond the default haploid; e.g. diploid genomes.
*/

import {d3} from '../lib';
import Layout from './layout';

class PairedLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);

    this._class = 'PairedLayout';

    this.margin = {
      left: 30
    };
  }

  rotateForward(setIndex, chrIndex, chrElement, callback) {
    console.warn('rotateForward not implemented for PairedLayout');
    // var self = this;
    // var ideo = this._ideo;
    //
    // // Get ideo container and chromosome set dimensions
    // var ideoBox = d3.select(ideo.selector).node().getBoundingClientRect();
    // var chrBox = chrElement.getBoundingClientRect();
    //
    // // Evaluate dimensions scale coefficients
    // var scaleX = (ideoBox.width / chrBox.height) * 0.97;
    // var scaleY = this._getYScale();
    //
    // // Evaluate y offset of chromosome.
    // // It is different for first and the second one
    // var yOffset = setIndex ? 150 : 25;
    //
    // var transform =
    //   'translate(15, ' + yOffset + ') scale(' + scaleX + ', ' + scaleY + ')';
    //
    // // Run rotation procedure
    // d3.select(chrElement.parentNode)
    //   .transition()
    //   .attr("transform", transform)
    //   .on('end', function() {
    //     // Run callback function if provided
    //     if (callback) {
    //       callback();
    //     }
    //
    //     var translateY = (6 * Number(!setIndex));
    //
    //     // Rotate band labels
    //     d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
    //       .attr('transform', 'rotate(90) translate(0, ' + translateY + ')')
    //       .attr('text-anchor', 'middle');
    //
    //     // Hide syntenic regions
    //     d3.selectAll(ideo.selector + ' .syntenicRegion')
    //       .style('display', 'none');
    //   });
    //
    // // Append new chromosome labels
    // var labels = this.getChromosomeLabels(chrElement);
    //
    // d3.select(this._ideo.getSvg())
    //   .append('g')
    //   .attr('class', 'tmp')
    //   .selectAll('text')
    //   .data(this.getChromosomeLabels(chrElement))
    //   .enter()
    //   .append('text')
    //   .attr('class', function(d, i) {
    //     return i === 0 && labels.length === 2 ? 'chrSetLabel' : null;
    //   })
    //   .attr('x', 0)
    //   .attr('y', yOffset + (self._config.chrWidth * scaleX / 2) * 1.15)
    //   .style('opacity', 0)
    //   .text(String)
    //   .transition()
    //   .style('opacity', 1);
  }

  rotateBack(setIndex, chrIndex, chrElement, callback) {
    console.warn('rotateBack not implemented for PairedLayout');
    //
    // var ideo = this._ideo;
    //
    // // Get intial transformation string for chromosome set
    // var translate = this.getChromosomeSetTranslate(setIndex);
    //
    // // Run rotation procedure
    // d3.select(chrElement.parentNode)
    //   .transition()
    //   .attr('transform', translate)
    //   .on('end', function() {
    //     // Run callback fnuction if provided
    //     callback();
    //
    //     // Show syntenic regions
    //     d3.selectAll(ideo.select + ' .syntenicRegion')
    //       .style('display', null);
    //
    //     // Reset changed attributes to original state
    //     d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
    //       .attr('transform', null)
    //       .attr('text-anchor', setIndex ? null : 'end');
    //   });
    //
    // d3.selectAll(ideo.selector + ' g.tmp')
    //   .style('opacity', 0)
    //   .remove();
  }

  getHeight() {
    return this._config.chrHeight + this.margin.left * 1.5;
  }

  getWidth() {
    return '97%';
  }

  getChromosomeBandTickY1(chrIndex) {
    return chrIndex % 2 ? this._config.chrWidth : this._config.chrWidth * 2;
  }

  getChromosomeBandTickY2(chrIndex) {
    var width = this._config.chrWidth;
    return chrIndex % 2 ? width - this._tickSize : width * 2 + this._tickSize;
  }

  getChromosomeBandLabelAnchor(chrIndex) {
    return chrIndex % 2 ? null : 'end';
  }

  getChromosomeBandLabelTranslate(band, chrIndex) {
    var x = chrIndex % 2 ? 10 : -this._config.chrWidth - 10;
    var y = this._ideo.round(band.px.start + band.px.width / 2) + 3;

    return {
      x: y,
      y: y,
      translate: 'rotate(-90) translate(' + x + ', ' + y + ')'
    };
  }

  getChromosomeLabelXPosition() {
    return -this._tickSize;
  }

  getChromosomeSetLabelXPosition() {
    return this._config.chrWidth / -2;
  }

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  }

  getChromosomeSetTranslate(setIndex) {
    var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setIndex);
    return (
      'rotate(90) ' +
      'translate(' + this.margin.left + ', -' + chromosomeSetYTranslate + ')'
    );
  }

  getChromosomeSetYTranslate(setIndex) {
    return 200 * (setIndex + 1);
  }

}

export default PairedLayout