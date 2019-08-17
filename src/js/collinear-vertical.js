// Commenting out until work is more complete.
//
// /**
//  * @fileoverview Functions for collinear chromosomes.
//  * Collinear chromosomes form a line together, unlike the default parallel
//  * geometry.
//  */

// import {d3} from './lib';

// /**
// * Rearrange chromosomes from horizontal to collinear
// */
// function rearrangeChromosomes(chrSets, yOffsets, x, config) {
//   var i, chrSet, y;

//   for (i = 0; i < chrSets.length; i++) {
//     chrSet = chrSets[i];
//     y = yOffsets[i];
//     if (config.showChromosomeLabels) {
//       chrSet.querySelector('.chrLabel > tspan').setAttribute('x', -config.chrWidth*2 - 13)
//       chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'start')
//     }
//     chrSet.setAttribute('transform', 'rotate(90) translate(' + y + ',' + x + ')');
//     chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
//   }
// }

// /**
// * Get pixel coordinates to use for rearrangement
// */
// function getyOffsets(chrSets, ideo) {
//   var yOffsets, i, index, prevChrSet, y, prevWidth, prevY, yBump;

//   yOffsets = [];
//   for (i = 0; i < chrSets.length; i++) {
//     index = (i === 0) ? i : i - 1;
//     prevChrSet = ideo.chromosomesArray[index];
//     if (i === 0) {
//       y = 20;
//     } else {
//       prevWidth = prevChrSet.width;
//       prevY = yOffsets[index];
//       yBump = (ideo.config.showChromosomeLabels ? 0 : 2);
//       y = prevY + prevWidth + yBump;
//       y += ideo.config.chrMargin;
//     }
//     yOffsets.push(y);
//   }

//   return yOffsets;
// }

// function collinearizeVerticalChromosomes(ideo) {
//   var chrSets, yOffsets, x, height,
//     config = ideo.config;

//   ideo.config.annotLabelHeight = 12;
//   var annotLabelHeight = ideo.config.annotLabelHeight;

//   if ('demarcateCollinearChromosomes' in ideo.config === false) {
//     ideo.config.demarcateCollinearChromosomes = true;
//   }

//   chrSets = document.querySelectorAll('.chromosome-set');

//   x = -40;

//   yOffsets = getyOffsets(chrSets, ideo);
//   rearrangeChromosomes(chrSets, yOffsets, x, config);

//   height = Math.round(yOffsets.slice(-1)[0] + 20);

//   d3.select(config.container + ' #_ideogramMiddleWrap')
//     .style('height', height + 'px');

//   d3.select(ideo.selector).attr('height', height);

//   d3.select('#_ideogramTrackLabelContainer').remove();
//   d3.select('#_ideogramInnerWrap')
//     .insert('div', ':first-child')
//     .attr('id', '_ideogramTrackLabelContainer')
//     .style('position', 'absolute');
// }

// export default collinearizeVerticalChromosomes;
