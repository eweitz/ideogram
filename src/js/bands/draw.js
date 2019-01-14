/**
 * @fileoverview Methods to draw cytogenetic bands and their labels
 *
 */

import {d3} from '../lib';
import {hideUnshownBandLabels, setBandsToShow} from './show';
import {staticColors, staticCss, staticGradients} from './styles';

/**
 * Draws text of cytoband label
 */
function drawBandLabelText(chr, bandsToLabel, chrModel, textOffsets) {
  var ideo = this,
    layout = ideo._layout,
    chrIndex = chrModel.chrIndex;

  chr.selectAll('text')
    .data(bandsToLabel)
    .enter()
    .append('g')
    .attr('class', function (d, i) {
      return 'bandLabel bsbsl-' + i;
    })
    .attr('transform', function (d) {
      var transform = layout.getChromosomeBandLabelTranslate(d, chrIndex);

      if (ideo.config.orientation === 'horizontal') {
        textOffsets[chrModel.id].push(transform.x + 13);
      } else {
        textOffsets[chrModel.id].push(transform.y + 6);
      }

      return transform.translate;
    })
    .append('text')
    .attr('text-anchor', layout.getChromosomeBandLabelAnchor(chrIndex))
    .text(function (d) {
      return d.name;
    });

  return textOffsets;
}

/**
 * Draws line between cytoband and its text label
 */
function drawBandLabelStalk(chr, bandsToLabel, chrModel, textOffsets) {
  var ideo = this;

  chr.selectAll('line.bandLabelStalk')
    .data(bandsToLabel)
    .enter()
    .append('g')
    .attr('class', function (d, i) {
      return 'bandLabelStalk bsbsl-' + i;
    })
    .attr('transform', function (d) {
      var x, y;

      x = ideo.round(d.px.start + d.px.width / 2);
      y = -10;

      textOffsets[chrModel.id].push(x + 13);

      return 'translate(' + x + ',' + y + ')';
    })
    .append('line')
    .attr('x1', 0)
    .attr('y1', ideo._layout.getChromosomeBandTickY1(chrModel.chrIndex))
    .attr('x2', 0)
    .attr('y2', ideo._layout.getChromosomeBandTickY2(chrModel.chrIndex));
}

function getChrModels(chromosomes) {
  var taxid, chr,
    chrModels = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrModels.push(chromosomes[taxid][chr]);
    }
  }

  return chrModels;
}

/**
 * Draws text and stalks for cytogenetic band labels.
 *
 * Band labels are text like "p11.11".
 * Stalks are small lines that visually connect labels to their bands.
 */
function drawBandLabels(chromosomes) {
  var i, chr, chrModel, chrModels, textOffsets, bandsToLabel,
    ideo = this,
    textOffsets = {};

  chrModels = getChrModels(chromosomes);

  for (i = 0; i < chrModels.length; i++) {
    chrModel = chrModels[i];
    chr = d3.select(ideo.selector + ' #' + chrModel.id);
    textOffsets[chrModel.id] = [];

    // Don't show "pter" label for telocentric chromosomes, e.g. mouse
    bandsToLabel = chrModel.bands.filter(d => d.name !== 'pter');

    textOffsets =
      ideo.drawBandLabelText(chr, bandsToLabel, chrModel, textOffsets);

    ideo.drawBandLabelStalk(chr, bandsToLabel, chrModel, textOffsets);
  }

  ideo.setBandsToShow(chrModels, textOffsets);
}

function getStainAndColors(i, colors) {
  var stain, color1, color2, color3;

  stain = colors[i][0];
  color1 = colors[i][1];
  color2 = colors[i][2];
  color3 = colors[i][3];

  return [stain, color1, color2, color3];
}

function getGradients(colors) {
  var i, stain, color1, color2, color3,
    gradients = '';

  for (i = 0; i < colors.length; i++) {
    [stain, color1, color2, color3] = getStainAndColors(i, colors);
    gradients +=
      '<linearGradient id="' + stain + '" x1="0%" y1="0%" x2="0%" y2="100%">';
    if (stain === "gneg") {
      gradients +=
        '<stop offset="70%" stop-color="' + color2 + '" />' +
        '<stop offset="95%" stop-color="' + color3 + '" />' +
        '<stop offset="100%" stop-color="' + color1 + '" />';
    } else {
      gradients +=
        '<stop offset="5%" stop-color="' + color1 + '" />' +
        '<stop offset="15%" stop-color="' + color2 + '" />' +
        '<stop offset="60%" stop-color="' + color3 + '" />';
    }
    gradients +=
      '</linearGradient>';
  }

  return gradients;
}

/**
 * Returns SVG gradients that give chromosomes a polished look
 */
function getBandColorGradients() {
  var css,
    gradients = '';

  gradients = getGradients(staticColors);

  css = staticCss;

  gradients += staticGradients;
  gradients = "<defs>" + gradients + "</defs>";
  gradients = css + gradients;

  return gradients;
}

export {
  drawBandLabels, getBandColorGradients, hideUnshownBandLabels, setBandsToShow,
  drawBandLabelText, drawBandLabelStalk
}