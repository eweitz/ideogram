/**
 * @fileoverview Functions for collinear chromosomes.
 * Collinear chromosomes form a line together, unlike the default parallel
 * geometry.
 */

import {d3} from './lib';

/**
* Rearrange chromosomes from horizontal to collinear
*/
function rearrangeChromosomes(chrSets, yOffsets, x, config) {
  var i, chrSet, y;

  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    y = yOffsets[i];
    if (config.showChromosomeLabels) {
      chrSet.querySelector('.chrLabel').setAttribute('x', config.chrWidth*2 + 10)
      chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'middle')
    }
    chrSet.setAttribute('transform', 'rotate(90) translate(' + x + ',' + y + ')');
    chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
  }
}

/**
* Get pixel coordinates to use for rearrangement 
*/
function getyOffsets(chrSets, ideo) {
  var yOffsets, i, index, prevChrSet, y, prevWidth, prevY, yBump;

  yOffsets = [];
  for (i = 0; i < chrSets.length; i++) {
    index = (i === 0) ? i : i - 1;
    prevChrSet = ideo.chromosomesArray[index];
    if (i === 0) {
      y = 20;
    } else {
      prevWidth = prevChrSet.width;
      prevY = yOffsets[index];
      yBump = (ideo.config.showChromosomeLabels ? 0 : 2);
      y = prevY + prevWidth + yBump;
      y += ideo.config.chrMargin;
    }
    yOffsets.push(y);
  }

  return yOffsets;
}

function collinearizeVerticalChromosomes(ideo) {
  var chrSets, yOffsets, x,
    config = ideo.config,
    annotHeight = config.annotationHeight;

  ideo.config.annotLabelHeight = 12;
  var annotLabelHeight = ideo.config.annotLabelHeight;

  if ('demarcateCollinearChromosomes' in ideo.config === false) {
    ideo.config.demarcateCollinearChromosomes = true;
  }

  chrSets = document.querySelectorAll('.chromosome-set');

  x = 20;

  yOffsets = getyOffsets(chrSets, ideo);
  rearrangeChromosomes(chrSets, yOffsets, x, config);

  d3.select(ideo.selector)
    .attr('width', x + config.chrWidth*2 + 20)
    .attr('height', yOffsets.slice(-1)[0] + 20);

  d3.select('#_ideogramTrackLabelContainer').remove();
  d3.select('#_ideogramInnerWrap')
    .insert('div', ':first-child')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');
}

export default collinearizeVerticalChromosomes;