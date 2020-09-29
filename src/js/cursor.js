/**
 * @fileoverview Allows a click event handler to be attached to the ideogram
 *
 * This works similar to the "brush" which allows a region to be selected.
 * The click handler does not allow a region, but a precise location.
 *
 */

import {d3} from './lib';

/**
 * Custom event handler, fired upon clicks on the chromosome (to change
 * position)
 */
function onCursorMove() {
  call(this.onCursorMoveCallback);
}

function setCursor(position, bpDomain, pxRange, xOffset, width, ideo) {
  var xScale;

  xScale = d3.scaleLinear().domain(bpDomain).range(pxRange);

  if (!('rotatable' in ideo.config && ideo.config.rotatable === false)) {
    console.warn('Using the cursor with rotate is not supported.');
  }

  var yTranslate = ideo._layout.getChromosomeSetYTranslate(0);
  var yOffset = yTranslate + (ideo.config.chrWidth - width) / 2;

  // TODO: check if newPosition is valid value (in range)

  var cursorBrush = d3.select(ideo.selector).append('g')
    .attr('class', 'brush')
    .attr('transform', 'translate(0, ' + yOffset + ')')
    .append('rect')
    .attr('class', 'cursor')
    .attr('x', xScale(position))
    .attr('y', 0)
    .attr('width', 1) // this could be a configuration param
    .attr('height', 30); // MAGIC NUMBER! need help with this one

  // call the callback for the first time (onLoad)
  if (ideo.onCursorMove) {
    ideo.onCursorMoveCallback(position);
  }

  if (!ideo.setCursorPosition) {
    ideo.setCursorPosition = function(newPosition) {
      // TODO: check if newPosition is valid value (in range)
      cursorBrush.attr('x', xScale(newPosition));
      if (ideo.onCursorMove) {
        ideo.onCursorMoveCallback(newPosition);
      }
    };
  }

  d3.selectAll(ideo.selector + ' .chromosome').on('click', function(event) {
    var x = event.offsetX; // minimum value seems to be 25

    // adjust for screen (6 is a magic number that seems to work)
    x -=6;

    // move the cursor
    cursorBrush.attr('x', x);

    // calculate the new position and perform callback
    var newPosition = Math.floor(xScale.invert(x));
    if (ideo.onCursorMove) {
      ideo.onCursorMoveCallback(newPosition);
    }
  });
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

/**
 * Creates a clickable cursor along a chromosome.
 *
 * @param position Genomic start coordinate in base pairs, e.g. 104325484
 */
function createClickCursor(position) {
  var chrModel, bpDomain,
    pxRange,
    ideo = this,
    width = ideo.config.chrWidth + 6.5, // 6.5 magic number?
    xOffset = ideo._layout.margin.left;

  if (typeof position === 'undefined') {
    return false;
  }

  chrModel = getChrModel(ideo.config.chromosome, ideo);
  [bpDomain, pxRange] = getBasePairDomainAndPixelRange(chrModel, xOffset);

  // call setCursor to complete the job.
  setCursor(position, bpDomain, pxRange, xOffset, width, ideo);
}

export {onCursorMove, createClickCursor};
