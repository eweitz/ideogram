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

import {d3} from './lib';

/**
 * Custom event handler, fired upon dragging sliding window on chromosome
 */
function onBrushMove() {
  call(this.onBrushMoveCallback);
}

function setBrush(bpDomain, pxRange, xOffset, width, ideo) {
  var xScale,
    length = ideo.config.chrHeight;

  xScale = d3.scaleLinear().domain(bpDomain).range(pxRange);

  ideo.brush = d3.brushX()
    .extent([[xOffset, 0], [length + xOffset, width]])
    .on('brush', _onBrushMove);

  function _onBrushMove({selection}) {
    var extent = selection.map(xScale.invert),
      from = Math.floor(extent[0]),
      to = Math.ceil(extent[1]);

    ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
  }
}

function getBasePairDomainAndPixelRange(chrModel, xOffset) {
  var band, i,
    bpDomain = [1],
    pxRange = [1],
    lastBand = chrModel.bands.slice(-1)[0];

  for (i = 0; i < chrModel.bands.length; i++) {
    band = chrModel.bands[i];
    bpDomain.push(band.bp.start);
    pxRange.push(band.px.start + xOffset);
  }

  bpDomain.push(lastBand.bp.stop - 1);
  pxRange.push(lastBand.px.stop + xOffset);

  return [bpDomain, pxRange];
}

/**
 * Account for calls like createBrush('chr1:104325484-119977655')
 */
function refineGenomicCoordinates(chr, from, to) {
  var nameSplit, fromToSplit;

  // Account for calls like createBrush('chr1:104325484-119977655')
  nameSplit = chr.split(':');
  fromToSplit = chr.split('-');
  if (nameSplit.length > 1 && fromToSplit.length > 1) {
    chr = nameSplit[0].replace('chr', '');
    fromToSplit = nameSplit[1].split('-');
    from = parseInt(fromToSplit[0]);
    to = parseInt(fromToSplit[1] - 1);
  }

  return [chr, from, to];
}

function getChrModel(chr, ideo) {
  var i, cm, chrModel;

  for (i = 0; i < ideo.chromosomesArray.length; i++) {
    cm = ideo.chromosomesArray[i];
    if (cm.name === chr) {
      chrModel = cm;
      return chrModel;
    }
  }
}

function writeBrush(chrModel, from, to, xOffset, width, ideo) {
  var x0, x1, yTranslate, yOffset;

  x0 = ideo.convertBpToPx(chrModel, from) + xOffset;
  x1 = ideo.convertBpToPx(chrModel, to) + xOffset;

  yTranslate = ideo._layout.getChromosomeSetYTranslate(0);
  yOffset = yTranslate + (ideo.config.chrWidth - width) / 2;

  d3.select(ideo.selector).append('g')
    .attr('class', 'brush')
    .attr('transform', 'translate(0, ' + yOffset + ')')
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);
}

function setSelectedRegion(from, to, ideo) {
  // Genomics web UIs are 1-based, fully closed.
  // I.e. If start = 20 bp and stop = 10 bp, then extent = 11 bp.
  // Details:
  // http://genome.ucsc.edu/blog/the-ucsc-genome-browser-coordinate-counting-systems/
  // https://www.biostars.org/p/84686/
  var extent = to - from + 1;
  ideo.selectedRegion = {from: from, to: to, extent: extent};
}

/**
 * Creates a sliding window along a chromosome
 *
 * @param chr Chromosome name (e.g. 1) or range, e.g. chr1:104325484-119977655
 * @param from Genomic start coordinate in base pairs, e.g. 104325484
 * @param to Genomic end coordinate in base pairs, e.g. 119977655
 */
function createBrush(chr, from, to) {
  var chrModel, chrLengthBp, bpDomain, pxRange, lastBand,
    ideo = this,
    width = ideo.config.chrWidth + 6.5,
    xOffset = ideo._layout.margin.left;

  [chr, from, to] = refineGenomicCoordinates(chr, from, to);

  chrModel = getChrModel(chr, ideo);

  [bpDomain, pxRange] = getBasePairDomainAndPixelRange(chrModel, xOffset);

  lastBand = chrModel.bands.slice(-1)[0];
  chrLengthBp = lastBand.bp.stop;

  if (typeof from === 'undefined') from = Math.floor(chrLengthBp / 10);
  if (typeof to === 'undefined') to = Math.ceil(from * 2);

  setBrush(bpDomain, pxRange, xOffset, width, ideo);

  setSelectedRegion(from, to, ideo);
  writeBrush(chrModel, from, to, xOffset, width, ideo);
}

export {onBrushMove, createBrush};
