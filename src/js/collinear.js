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
function rearrangeChromosomes(chrSets, xOffsets, y, ideo) {
  var i, chr, chrSet, taxid, x, adjustedY, orgIndex, chrLabelY;

  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    x = xOffsets[i];

    chr = ideo.chromosomesArray[i];
    taxid = chr.id.split('-')[1];
    orgIndex = ideo.config.taxids.indexOf(taxid);
    adjustedY = y + orgIndex * 200;
    if (orgIndex === 0 && ideo.config.multiorganism) {
      chrLabelY = 6;
      adjustedY += ideo.config.chrWidth * 2;
    } else {
      chrLabelY = ideo.config.chrWidth * 2 + 10;
    }

    if (ideo.config.showChromosomeLabels) {
      chrSet.querySelector('.chrLabel').setAttribute('y', chrLabelY);
      chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'middle');
    }
    chrSet.setAttribute('transform', 'translate(' + x + ',' + adjustedY + ')');
    chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
  }
}

/**
* Get pixel coordinates to use for rearrangement
*/
function getxOffsets(chrSets, ideo) {
  var xOffsets, i, index, chr, prevChr, x, prevWidth, prevX, xBump, taxid,
    seenTaxids = {};

  xOffsets = [];
  for (i = 0; i < chrSets.length; i++) {
    chr = ideo.chromosomesArray[i];
    taxid = chr.id.split('-')[1];
    index = (i === 0) ? i : i - 1;
    prevChr = ideo.chromosomesArray[index];
    if (i === 0 || taxid in seenTaxids === false) {
      x = 20;
      seenTaxids[taxid] = 1;
    } else {
      prevWidth = prevChr.width;
      prevX = xOffsets[index];
      xBump = (ideo.config.showChromosomeLabels ? 0 : 2);
      x = prevX + prevWidth + xBump + ideo.config.chrMargin;
    }
    xOffsets.push(x);
  }

  return xOffsets;
}

// /**
//  * Track number of chromosomes in preceding organisms.
//  * Adds an instance variable to the ideogram object to offset
//  * chromosome indices.  Needed for multiorganism collinear ideograms.
//  */
// function setTaxidChrOffsets(ideo) {
//   var taxidChrOffsets, taxidChrOffset;

//   taxidChrOffsets = {};

//   taxidChrOffset = 0;
//   ideo.config.organism.forEach((org) => {
//     var taxid, numChrs;
//     taxid = ideo.getTaxid(org);
//     taxidChrOffsets[taxid] = taxidChrOffset;
//     numChrs = Object.keys(ideo.chromosomes[taxid]).length;
//     taxidChrOffset += numChrs;
//   });

//   ideo.taxidChrOffsets = taxidChrOffsets;
// }

// /**
//  * Change chromosome indices for multiorganism collinear ideograms
//  * This is needed to account for x-offsets.
//  */
// function adjustChrIndex(ideo) {
//   setTaxidChrOffsets(ideo);

//   ideo.chromosomesArray.map((chr) => {
//     var taxid = chr.id.split('-')[1];
//     var taxidChrOffset = ideo.taxidChrOffsets[taxid];
//     chr.chrIndex -= taxidChrOffset;
//     ideo.chromosomes[taxid][chr.name].chrIndex = chr.chrIndex;
//   });
// }

function collinearizeChromosomes(ideo) {
  var chrSets, xOffsets, y, height, width,
    config = ideo.config,
    annotHeight = config.annotationHeight || 0;

  if (config.orientation === 'vertical') {
    collinearizeVerticalChromosomes(ideo);
    return;
  }

  // if (config.multiorganism) adjustChrIndex(ideo);

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
  rearrangeChromosomes(chrSets, xOffsets, y, ideo);

  height = y + config.chrWidth * 2 + 20;

  if (config.multiorganism) {
    height *= 8;
    var maxWidth = 0;
    xOffsets.forEach(d => {
      if (d > maxWidth) maxWidth = d;
    });
    width = maxWidth + 20;
  } else {
    width = xOffsets.slice(-1)[0] + 20;
  }

  d3.select(ideo.selector)
    .attr('width', width)
    .attr('height', height);

  d3.select('#_ideogramTrackLabelContainer').remove();
  d3.select('#_ideogramInnerWrap')
    .insert('div', ':first-child')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');
}

export default collinearizeChromosomes;
