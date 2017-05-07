/**
* Horizontal layout class
* Ideogram instances with horizontal layout are oriented with each chromosome
* starting at left and ending at right, and aligned as rows.
*/

// import * as d3 from 'd3';
// import {Layout} from './layout';

// export class HorizontalLayout extends Layout {
//
//   constructor(config, ideo) {
//     super(config, ideo);
//     this._class = 'HorizontalLayout';
//     this._margin = {
//       left: 20,
//       top: 30
//     };
//   }
//
//   _getLeftMargin() {
//     var margin = Layout.prototype._getLeftMargin.call(this);
//     if (this._config.ploidy > 1) {
//       margin *= 1.8;
//     }
//
//     return margin;
//   }
//
//   rotateForward(setNumber, chrNumber, chrElement, callback) {
//     var xOffset = 30;
//
//     var ideoBox = d3.select(this._ideo.selector).node().getBoundingClientRect();
//     var chrBox = chrElement.getBoundingClientRect();
//
//     var scaleX = (ideoBox.height / (chrBox.width + xOffset / 2)) * 0.9;
//     var scaleY = this._getYScale();
//
//     var yOffset = (chrNumber + 1) * ((this._config.chrWidth * 2) * scaleY);
//
//     var transform = (
//       'rotate(90) ' +
//       'translate(' + xOffset + ', -' + yOffset + ') ' +
//       'scale(' + scaleX + ', ' + scaleY + ')'
//     );
//
//     d3.select(chrElement.parentNode)
//           .transition()
//           .attr("transform", transform)
//           .on('end', callback);
//
//       // Append new chromosome labels
//     var labels = this.getChromosomeLabels(chrElement);
//     d3.select(this._ideo.getSvg())
//           .append('g')
//           .attr('class', 'tmp')
//           .selectAll('text')
//           .data(labels)
//           .enter()
//           .append('text')
//           .attr('class', function(d, i) {
//             return i === 0 && labels.length === 2 ? 'chrSetLabel' : null;
//           })
//           .attr('x', 30)
//           .attr('y', function(d, i) {
//             return (i + 1 + labels.length % 2) * 12;
//           })
//           .style('text-anchor', 'middle')
//           .style('opacity', 0)
//           .text(String)
//           .transition()
//           .style('opacity', 1);
//   }
//
//   rotateBack(setNumber, chrNumber,
//     chrElement, callback) {
//     var translate = this.getChromosomeSetTranslate(setNumber);
//
//     d3.select(chrElement.parentNode)
//           .transition()
//           .attr("transform", translate)
//           .on('end', callback);
//
//     d3.selectAll(this._ideo.selector + ' g.tmp')
//           .style('opacity', 0)
//           .remove();
//   }
//
//   getHeight(taxId) {
//       // Get last chromosome set offset.
//     var numChromosomes = this._config.chromosomes[taxId].length;
//     var lastSetOffset = this.getChromosomeSetYTranslate(numChromosomes - 1);
//
//       // Get last chromosome set size.
//     var lastSetSize = this._getChromosomeSetSize(numChromosomes - 1);
//
//       // Increase offset by last chromosome set size
//     lastSetOffset += lastSetSize;
//
//     return lastSetOffset + this._getAdditionalOffset() * 2;
//   }
//
//   getWidth() {
//     return this._config.chrHeight + this._margin.top * 1.5;
//   }
//
//   getChromosomeSetLabelAnchor() {
//     return 'end';
//   }
//
//   getChromosomeBandLabelAnchor() {
//     return null;
//   }
//
//   getChromosomeBandTickY1() {
//     return 2;
//   }
//
//   getChromosomeBandTickY2() {
//     return 10;
//   }
//
//   getChromosomeBandLabelTranslate(band) {
//     var x =
//       this._ideo.round(-this._tickSize + band.px.start + band.px.width / 2);
//     var y = -10;
//
//     return {
//       x: x,
//       y: y,
//       translate: 'translate(' + x + ',' + y + ')'
//     };
//   }
//
//   getChromosomeSetLabelTranslate() {
//     return null;
//   }
//
//   getChromosomeSetTranslate(setNumber) {
//     var leftMargin = this._getLeftMargin();
//     var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setNumber);
//     return 'translate(' + leftMargin + ', ' + chromosomeSetYTranslate + ')';
//   }
//
//   getChromosomeSetYTranslate(setNumber) {
//     // If no detailed description provided just use one formula for all cases.
//     if (!this._config.ploidyDesc) {
//       return this._config.chrMargin * (setNumber + 1);
//     }
//
//     // Id detailed description provided start to calculate offsets
//     //  for each chromosome set separately. This should be done only once.
//     if (!this._translate) {
//       // First offset equals to zero.
//       this._translate = [1];
//
//       // Loop through description set
//       for (var i = 1; i < this._config.ploidyDesc.length; i++) {
//         this._translate[i] =
//           this._translate[i - 1] + this._getChromosomeSetSize(i - 1);
//       }
//     }
//
//     return this._translate[setNumber];
//   }
//
//   getChromosomeSetLabelXPosition(i) {
//     if (this._config.ploidy === 1) {
//       return this.getChromosomeLabelXPosition(i);
//     } else {
//       return -20;
//     }
//   }
//
//   getChromosomeSetLabelYPosition(i) {
//     var setSize = this._ploidy.getSetSize(i),
//       config = this._config,
//       chrMargin = config.chrMargin,
//       chrWidth = config.chrWidth;
//
//     if (config.ploidy === 1) {
//       y = chrWidth / 2 + 3;
//     } else {
//       y = (setSize * chrMargin) / 2;
//     }
//
//     return y;
//   }
//
//   getChromosomeLabelXPosition() {
//     return -8;
//   }
//
//   getChromosomeLabelYPosition() {
//     return this._config.chrWidth;
//   }
//
// }
