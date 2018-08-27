/**
 * @fileoverview Methods to show (or hide) cytogenetic banding data
 */

import * as d3selection from 'd3-selection';

import {Object} from '../lib.js';

var d3 = Object.assign({}, d3selection);

function hideUnshownBandLabels() {
  var ideo = this;
  var bandsToShow = ideo.bandsToShow.join(',');

  // d3.selectAll resolves to querySelectorAll (QSA).
  // QSA takes a surprisingly long time to complete,
  // and scales with the number of selectors.
  // Most bands are hidden, so we can optimize by
  // Hiding all bands, then QSA'ing and displaying the
  // relatively few bands that are shown.
  var t0C = new Date().getTime();
  d3.selectAll(ideo.selector + ' .bandLabel, .bandLabelStalk')
    .style('display', 'none');
  d3.selectAll(bandsToShow).style('display', '');
}


/**
 * Sets band labels to display on each chromosome, avoiding label overlap
 */
function setBandsToShow(chrs, textOffsets) {
  var textsLength, overlappingLabelXRight, index, prevHiddenBoxIndex, xLeft,
    prevLabelXRight, prevTextBoxLeft, prevTextBoxWidth, textPadding, i,
    indexesToShow, chrModel, selectorsToShow, ithLength, j,
    ideo = this;

  ideo.bandsToShow = [];

  for (i = 0; i < chrs.length; i++) {

    indexesToShow = [];
    chrModel = chrs[i];
    textsLength = textOffsets[chrModel.id].length

    overlappingLabelXRight = 0;
    textPadding = 5;

    for (index = 0; index < textsLength; index++) {
      // Ensures band labels don't overlap

      xLeft = textOffsets[chrModel.id][index];

      if (xLeft < overlappingLabelXRight + textPadding === false) {
        indexesToShow.push(index);
      } else {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
        continue;
      }

      if (prevHiddenBoxIndex !== index) {
        // This getBoundingClientRect() forces Chrome's
        // 'Recalculate Style' and 'Layout', which takes 30-40 ms on Chrome.
        // TODO: This forced synchronous layout would be nice to eliminate.
        // prevTextBox = texts[index].getBoundingClientRect();
        // prevLabelXRight = prevTextBox.left + prevTextBox.width;

        // TODO: Account for number of characters in prevTextBoxWidth,
        // maybe also zoom.
        prevTextBoxLeft = textOffsets[chrModel.id][index];
        prevTextBoxWidth = 36;

        prevLabelXRight = prevTextBoxLeft + prevTextBoxWidth;
      }

      if (
        xLeft < prevLabelXRight + textPadding
      ) {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
      } else {
        indexesToShow.push(index);
      }
    }

    selectorsToShow = [];
    ithLength = indexesToShow.length;

    for (j = 0; j < ithLength; j++) {
      index = indexesToShow[j];
      selectorsToShow.push('#' + chrModel.id + ' .bsbsl-' + index);
    }

    ideo.bandsToShow = ideo.bandsToShow.concat(selectorsToShow);
  }
}
  
export {hideUnshownBandLabels, setBandsToShow};