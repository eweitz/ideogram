/**
 * @fileoverview Methods to show (or hide) cytogenetic banding data
 */

import * as d3selection from 'd3-selection';


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
  d3.selectAll(ideo.selector + ' .bandLabel, .bandLabelStalk')
    .style('display', 'none');
  d3.selectAll(bandsToShow).style('display', '');
}

function getPrevRight(prevLabelXRight, prevHiddenBoxIndex, i,
  textOffsets, chrModel) {
  var prevTextBoxLeft, prevTextBoxWidth;

  if (prevHiddenBoxIndex !== i) {
    // This getBoundingClientRect() forces Chrome's
    // 'Recalculate Style' and 'Layout', which takes 30-40 ms on Chrome.
    // TODO: This forced synchronous layout would be nice to eliminate.
    // prevTextBox = texts[i].getBoundingClientRect();
    // prevLabelXRight = prevTextBox.left + prevTextBox.width;

    // TODO: Account for number of characters in prevTextBoxWidth,
    // maybe also zoom.
    prevTextBoxLeft = textOffsets[chrModel.id][i];
    prevTextBoxWidth = 36;

    prevLabelXRight = prevTextBoxLeft + prevTextBoxWidth;
  }

  return prevLabelXRight;
}

function updateShown(indexesToShow, overlapRight, left, pad, prevRight, i,
  isBefore) {
  var hiddenIndex, doSkip,
    thisRight = isBefore ? overlapRight : prevRight;

  if (left < pad + thisRight) {
    overlapRight = prevRight;
    hiddenIndex = i;
    doSkip = isBefore ? true : false;
  } else {
    indexesToShow.push(i);
  }

  return [indexesToShow, overlapRight, hiddenIndex, doSkip];
}

function getIndexesToShow(offsets, chrModel) {
  var i, hiddenIndex, left, prevRight, doSkip,
    indexesToShow = [],
    textsLength = offsets[chrModel.id].length,
    overlapRight = 0, // Right X coordinate of overlapping label
    pad = 5; // text padding

  for (i = 0; i < textsLength; i++) {
    // Ensures band labels don't overlap
    left = offsets[chrModel.id][i];

    [indexesToShow, overlapRight, hiddenIndex, doSkip] =
      updateShown(indexesToShow, overlapRight, left, pad, prevRight, i, true);
    if (doSkip) continue;

    prevRight = getPrevRight(prevRight, hiddenIndex, i, offsets, chrModel);

    [indexesToShow, overlapRight, hiddenIndex, doSkip] =
      updateShown(indexesToShow, overlapRight, left, pad, prevRight, i, false);
  }

  return indexesToShow;
}

/**
 * Sets band labels to display on each chromosome, avoiding label overlap
 */
function setBandsToShow(chrs, textOffsets) {
  var index, i, j, indexesToShow, chrModel, selectorsToShow, ithLength, j,
    ideo = this;

  ideo.bandsToShow = [];

  for (i = 0; i < chrs.length; i++) {

    chrModel = chrs[i];

    indexesToShow = getIndexesToShow(textOffsets, chrModel);

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