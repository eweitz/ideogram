/**
 * @fileoverview Methods to create and handle a brush on a chromosome.
 *
 * Ideogram.js enables users to display a box around part of a chromosome
 * that represents a "currently selected" region.  The user can move this
 * box like a sliding window, e.g. by clicking and dragging the mouse.
 *
 * For background, see:
 * https://github.com/d3/d3-brush
 */

import * as d3selection from 'd3-selection';
// See https://github.com/d3/d3/issues/2733
import {event as currentEvent} from 'd3-selection';
import * as d3brush from 'd3-brush';
import {scaleLinear} from 'd3-scale';
import {max} from 'd3-array';

import {Object} from './lib.js';

var d3 = Object.assign({}, d3brush, d3selection);
d3.scaleLinear = scaleLinear;
d3.max = max;

/**
 * Custom event handler, fired upon dragging sliding window on chromosome
 */
function onBrushMove() {
  call(this.onBrushMoveCallback);
}

/**
 * Creates a sliding window along a chromosome
 *
 * @param from Genomic start coordinate, in base pairs
 * @param to Genomic end coordinate, in base pairs
 */
function createBrush(from, to) {
  var ideo = this,
    width = ideo.config.chrWidth + 6.5,
    length = ideo.config.chrHeight,
    chr = ideo.chromosomesArray[0],
    chrLengthBp = chr.bands[chr.bands.length - 1].bp.stop,
    xOffset = this._layout.getMargin().left,
    x0, x1, band, i,
    bpDomain = [0],
    pxRange = [0],
    xScale;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    bpDomain.push(band.bp.stop);
    pxRange.push(band.px.stop + xOffset);
  }

  xScale = d3.scaleLinear().domain(bpDomain).range(pxRange);

  if (typeof from === 'undefined') {
    from = Math.floor(chrLengthBp / 10);
  }

  if (typeof to === 'undefined') {
    to = Math.ceil(from * 2);
  }

  ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

  x0 = ideo.convertBpToPx(chr, from) + xOffset;
  x1 = ideo.convertBpToPx(chr, to) + xOffset;

  ideo.brush = d3.brushX()
    .extent([[xOffset, 0], [length + xOffset, width]])
    .on('brush', onBrushMove);

  var yTranslate = this._layout.getChromosomeSetYTranslate(0);
  var yOffset = yTranslate + (ideo.config.chrWidth - width) / 2;
  d3.select(ideo.selector).append('g')
    .attr('class', 'brush')
    .attr('transform', 'translate(0, ' + yOffset + ')')
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);

  function onBrushMove() {

    var extent = currentEvent.selection.map(xScale.invert),
      from = Math.floor(extent[0]),
      to = Math.ceil(extent[1]);

    ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
  }
}

export {onBrushMove, createBrush};