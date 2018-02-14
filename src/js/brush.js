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
 * @param chr Chromosome name (e.g. '1') or range, e.g. 'chr1:104325484-119977655'
 * @param from Genomic start coordinate in base pairs, e.g. 104325484
 * @param to Genomic end coordinate in base pairs, e.g. 119977655
 */
function createBrush(chr, from, to) {
  var ideo = this,
    width = ideo.config.chrWidth + 6.5,
    length = ideo.config.chrHeight,
    xOffset = this._layout.getMargin().left,
    chrModel, cm, chrLengthBp, nameSplit, fromToSplit,
    lastBand, x0, x1, band, i,
    bpDomain = [1],
    pxRange = [1],
    xScale;

  // Account for calls like createBrush('chr1:104325484-119977655')
  nameSplit = chr.split(':');
  fromToSplit = chr.split('-');
  if (nameSplit.length > 1 && fromToSplit.length > 1) {
    chr = nameSplit[0].replace('chr', '');
    fromToSplit = nameSplit[1].split('-');
    from = parseInt(fromToSplit[0]);
    to = parseInt(fromToSplit[1] - 1);
  }

  for (i = 0; i < ideo.chromosomesArray.length; i++) {
    cm = ideo.chromosomesArray[i];
    if (cm.name === chr) {
      chrModel = cm;
      break;
    }
  }

  lastBand = chrModel.bands.slice(-1)[0];
  chrLengthBp = lastBand.bp.stop;

  for (i = 0; i < chrModel.bands.length; i++) {
    band = chrModel.bands[i];
    bpDomain.push(band.bp.start);
    pxRange.push(band.px.start + xOffset);
  }

  bpDomain.push(lastBand.bp.stop - 1);
  pxRange.push(lastBand.px.stop + xOffset);

  xScale = d3.scaleLinear().domain(bpDomain).range(pxRange);

  if (typeof from === 'undefined') {
    from = Math.floor(chrLengthBp / 10);
  }

  if (typeof to === 'undefined') {
    to = Math.ceil(from * 2);
  }

  // Genomics web UIs are 1-based, fully closed.
  // I.e. If start = 20 bp and stop = 10 bp, then extent = 11 bp.
  // Details:
  // http://genome.ucsc.edu/blog/the-ucsc-genome-browser-coordinate-counting-systems/
  // https://www.biostars.org/p/84686/
  var extent = to - from + 1;
  ideo.selectedRegion = {from: from, to: to, extent: extent};

  x0 = ideo.convertBpToPx(chrModel, from);
  x1 = ideo.convertBpToPx(chrModel, to);

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