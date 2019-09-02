/**
 * @fileoverview Functions for collinear chromosomes.
 * Collinear chromosomes form a line together, unlike the default parallel
 * geometry.
 */

import {d3} from './lib';

/**
* Rearrange chromosomes from horizontal to collinear
*/
function rearrangeChromosomes(chrSets, yOffsets, x, ideo) {
  var i, chrSet, y, chrLabelX, adjustedX, chr, taxid, orgIndex,
    config = ideo.config;

  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    y = yOffsets[i];

    chr = ideo.chromosomesArray[i];
    taxid = chr.id.split('-')[1];
    orgIndex = ideo.config.taxids.indexOf(taxid);
    adjustedX = x - orgIndex * 200;
    if (orgIndex === 0) {
      chrLabelX = -34;
      adjustedX += ideo.config.chrWidth * 2 - 16;
    } else {
      chrLabelX = ideo.config.chrWidth * 2 - 24;
    }

    if (config.showChromosomeLabels) {
      chrSet.querySelector('.chrLabel > tspan').setAttribute('x', chrLabelX);
      chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'start');
    }
    chrSet.setAttribute('transform', 'rotate(90) translate(' + y + ',' + adjustedX + ')');
    chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
  }
}

/**
* Get pixel coordinates to use for rearrangement
*/
function getyOffsets(chrSets, ideo) {
  var yOffsets, i, index, chr, prevChr, y, prevWidth, prevY, yBump, taxid,
    seenTaxids = {};

  yOffsets = [];
  for (i = 0; i < chrSets.length; i++) {
    chr = ideo.chromosomesArray[i];
    taxid = chr.id.split('-')[1];
    index = (i === 0) ? i : i - 1;
    prevChr = ideo.chromosomesArray[index];
    if (i === 0 || taxid in seenTaxids === false) {
      y = 20;
      seenTaxids[taxid] = 1;
    } else {
      prevWidth = prevChr.width;
      prevY = yOffsets[index];
      yBump = (ideo.config.showChromosomeLabels ? 0 : 2);
      y = prevY + prevWidth + yBump + ideo.config.chrMargin;
    }
    yOffsets.push(y);
  }

  return yOffsets;
}

function collinearizeVerticalChromosomes(ideo) {
  var chrSets, yOffsets, x, height, width,
    config = ideo.config;

  ideo.config.annotLabelHeight = 12;
  // var annotLabelHeight = ideo.config.annotLabelHeight;

  if ('demarcateCollinearChromosomes' in ideo.config === false) {
    ideo.config.demarcateCollinearChromosomes = true;
  }

  chrSets = document.querySelectorAll('.chromosome-set');

  x = -40;

  yOffsets = getyOffsets(chrSets, ideo);
  rearrangeChromosomes(chrSets, yOffsets, x, ideo);

  width = Math.round(yOffsets.slice(-1)[0] + 20);

  if (config.multiorganism) {
    height *= 8;
    var maxHeight = 0;
    yOffsets.forEach(d => {
      if (d > maxHeight) maxHeight = d;
    });
    height = maxHeight + 20;
  } else {
    height = xOffsets.slice(-1)[0] + 20;
  }

  d3.select(ideo.selector)
    .attr('height', height)
    .attr('width', width);

  d3.select('#_ideogramTrackLabelContainer').remove();
  d3.select('#_ideogramInnerWrap')
    .insert('div', ':first-child')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');
}

export default collinearizeVerticalChromosomes;
