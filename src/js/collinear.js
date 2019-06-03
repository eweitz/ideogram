/**
 * @fileoverview Functions for collinear chromosomes.
 * Collinear chromosomes form a line together, unlike the default parallel
 * geometry.
 */

import {d3} from './lib';
import collinearizeVerticalChromosomes from './collinear-vertical';

/**
* Rearrange chromosomes from horizontal to collinear
*/
function rearrangeChromosomes(chrSets, xOffsets, y, config) {
  var i, chrSet, x;

  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    x = xOffsets[i];
    if (config.showChromosomeLabels) {
      chrSet.querySelector('.chrLabel').setAttribute('y', config.chrWidth*2 + 10)
      chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'middle')
    }
    chrSet.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
  }
}

/**
* Get pixel coordinates to use for rearrangement 
*/
function getxOffsets(chrSets, ideo) {
  var xOffsets, i, index, prevChrSet, x, prevWidth, prevX, xBump;

  xOffsets = [];
  for (i = 0; i < chrSets.length; i++) {
    index = (i === 0) ? i : i - 1;
    prevChrSet = ideo.chromosomesArray[index];
    if (i === 0) {
      x = 20;
    } else {
      prevWidth = prevChrSet.width;
      prevX = xOffsets[index];
      xBump = (ideo.config.showChromosomeLabels ? 0 : 2);
      x = prevX + prevWidth + xBump + ideo.config.chrMargin;
    }
    xOffsets.push(x);
  }

  return xOffsets;
}

function collinearizeChromosomes(ideo) {
  var chrSets, xOffsets, y, xOffsets, height,
    config = ideo.config,
    annotHeight = config.annotationHeight || 0;

  if (config.orientation === 'vertical') {
    collinearizeVerticalChromosomes(ideo);
    return;
  }

  ideo.config.annotLabelHeight = 12;
  var annotLabelHeight = ideo.config.annotLabelHeight;

  if ('demarcateCollinearChromosomes' in ideo.config === false) {
    ideo.config.demarcateCollinearChromosomes = true;
  }

  chrSets = document.querySelectorAll('.chromosome-set');

  y = (
    (config.numAnnotTracks * (annotHeight + annotLabelHeight + 4)) -
    config.chrWidth + 1
  );

  xOffsets = getxOffsets(chrSets, ideo);
  rearrangeChromosomes(chrSets, xOffsets, y, config);

  height = y + config.chrWidth*2 + 20;
  if (config.multiorganism) height *= 4;

  d3.select(ideo.selector)
    .attr('width', xOffsets.slice(-1)[0] + 20)
    .attr('height', height);

  d3.select('#_ideogramTrackLabelContainer').remove();
  d3.select('#_ideogramInnerWrap')
    .insert('div', ':first-child')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');
}

export default collinearizeChromosomes;