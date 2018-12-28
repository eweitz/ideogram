/**
 * @fileoverview Functions for collinear chromosomes.
 * Collinear chromosomes form a line together, unlike the default parallel
 * geometry.
 */

import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

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
      if (ideo.config.showChromosomeLabels) {
        xBump = 0.08;
      } else {
        xBump = 2;
      }
      x = Math.round(prevX + prevWidth) + xBump;
    }
    xOffsets.push(x);
  }

  return xOffsets;
}

function collinearizeChromosomes(ideo) {
  var chrSets, xOffsets, annotLabelHeight, y, xOffsets,
    config = ideo.config, annotHeight = config.annotationHeight;

  chrSets = document.querySelectorAll('.chromosome-set-container');
  annotLabelHeight = 12;

  y = (
    (config.numAnnotTracks * (annotHeight + annotLabelHeight + 4)) -
    config.chrWidth + 1
  );

  xOffsets = getxOffsets(chrSets, ideo);
  rearrangeChromosomes(chrSets, xOffsets, y, config);

  d3.select(ideo.selector)
    .attr('width', xOffsets.slice(-1)[0] + 20)
    .attr('height', y + config.chrWidth*2 + 20);

  d3.select('#_ideogramTrackLabelContainer').remove();
  d3.select('#_ideogramInnerWrap')
    .insert('div', ':first-child')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');
}

export default collinearizeChromosomes;