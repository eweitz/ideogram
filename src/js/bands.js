/**
 * @fileoverview Methods for processing chromosome length and band data.
 *
 * Ideogram.js depicts chromosomes using data on their length, name, and
 * (if dealing with a very well-studied organism) cytogenetic banding data.
 * This file processes band data that comes from biological research
 * institutions.
 *
 * For background on cytogenetic bands and how they are used in genomics, see:
 * https://ghr.nlm.nih.gov/primer/howgeneswork/genelocation
 *
 */

import * as d3selection from 'd3-selection';

import {Object} from './lib.js';

var d3 = Object.assign({}, d3selection);

/**
 * Gets chromosome band data from a TSV file, or, if band data is
 * prefetched, from an array
 *
 * NCBI:
 * #chromosome arm band iscn_start iscn_stop bp_start bp_stop stain density
 * ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
 */
function getBands(content, taxid, chromosomes) {
  var lines = {},
    delimiter, tsvLines, columns, line, stain, chr,
    i, init, tsvLinesLength, source,
    start, stop, firstColumn, tmp;

  if (content.slice(0, 15) === 'window.chrBands') {
    source = 'native';
  }

  if (
    chromosomes instanceof Array &&
    typeof chromosomes[0] === 'object'
  ) {
    tmp = [];
    for (i = 0; i < chromosomes.length; i++) {
      tmp.push(chromosomes[i].name);
    }
    chromosomes = tmp;
  }

  if (typeof chrBands === 'undefined' && source !== 'native') {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    if (source === 'native') {
      tsvLines = eval(content);
    } else {
      tsvLines = content;
    }
    init = 0;
  }

  tsvLinesLength = tsvLines.length;

  for (i = init; i < tsvLinesLength; i++) {
    columns = tsvLines[i].split(delimiter);

    chr = columns[0];

    if (
      // If a specific set of chromosomes has been requested, and
      // the current chromosome
      typeof (chromosomes) !== 'undefined' &&
      chromosomes.indexOf(chr) === -1
    ) {
      continue;
    }

    if (chr in lines === false) {
      lines[chr] = [];
    }

    stain = columns[7];
    if (columns[8]) {
      // For e.g. acen and gvar, columns[8] (density) is undefined
      stain += columns[8];
    }

    line = {
      chr: chr,
      bp: {
        start: parseInt(columns[5], 10),
        stop: parseInt(columns[6], 10)
      },
      iscn: {
        start: parseInt(columns[3], 10),
        stop: parseInt(columns[4], 10)
      },
      px: {
        start: -1,
        stop: -1,
        width: -1
      },
      name: columns[1] + columns[2],
      stain: stain,
      taxid: taxid
    };

    lines[chr].push(line);
  }

  return lines;
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
 * Draws labels and stalks for cytogenetic bands.
 *
 * Band labels are text like "p11.11".
 * Stalks are small lines that visually connect labels to their bands.
 */
function drawBandLabels(chromosomes) {
  var i, chr, chrs, taxid, chrModel, chrIndex, textOffsets,
    bandsToLabel,
    ideo = this,
    orientation = ideo.config.orientation;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }

  textOffsets = {};

  chrIndex = 0;
  for (i = 0; i < chrs.length; i++) {
    chrIndex += 1;

    chrModel = chrs[i];

    // Don't show "pter" label for telocentric chromosomes, e.g. mouse
    bandsToLabel = chrModel.bands.filter(d => d.name !== 'pter');

    chr = d3.select(ideo.selector + ' #' + chrModel.id);

    // var chrMargin = this.config.chrMargin * chrIndex,
    //   lineY1, lineY2;
    //
    // lineY1 = chrMargin;
    // lineY2 = chrMargin - 8;
    //
    // if (
    //   chrIndex === 1 &&
    //   "perspective" in this.config && this.config.perspective === "comparative"
    // ) {
    //   lineY1 += 18;
    //   lineY2 += 18;
    // }

    textOffsets[chrModel.id] = [];

    chr.selectAll('text')
      .data(bandsToLabel)
      .enter()
      .append('g')
      .attr('class', function(d, i) {
        return 'bandLabel bsbsl-' + i;
      })
      .attr('transform', function(d) {
        var transform = ideo._layout.getChromosomeBandLabelTranslate(d, i);

        if (orientation === 'horizontal') {
          textOffsets[chrModel.id].push(transform.x + 13);
        } else {
          textOffsets[chrModel.id].push(transform.y + 6);
        }

        return transform.translate;
      })
      .append('text')
      .attr('text-anchor', ideo._layout.getChromosomeBandLabelAnchor(i))
      .text(function(d) {
        return d.name;
      });

    // var adapter = ModelAdapter.getInstance(ideo.chromosomesArray[i]);
    // var view = Chromosome.getInstance(adapter, ideo.config, ideo);

    chr.selectAll('line.bandLabelStalk')
      .data(bandsToLabel)
      .enter()
      .append('g')
      .attr('class', function(d, i) {
        return 'bandLabelStalk bsbsl-' + i;
      })
      .attr('transform', function(d) {
        var x, y;

        x = ideo.round(d.px.start + d.px.width / 2);
        y = -10;

        textOffsets[chrModel.id].push(x + 13);

        return 'translate(' + x + ',' + y + ')';
      })
      .append('line')
      .attr('x1', 0)
      .attr('y1', function() {
        return ideo._layout.getChromosomeBandTickY1(i);
      })
      .attr('x2', 0)
      .attr('y2', function() {
        return ideo._layout.getChromosomeBandTickY2(i);
      });
  }

  ideo.setBandsToShow(chrs, textOffsets);
}

/**
 * Returns SVG gradients that give chromosomes a polished look
 */
function getBandColorGradients() {
  var colors,
    stain, color1, color2, color3,
    css,
    gradients = '';

  colors = [
    ['gneg', '#FFF', '#FFF', '#DDD'],
    ['gpos25', '#C8C8C8', '#DDD', '#BBB'],
    ['gpos33', '#BBB', '#BBB', '#AAA'],
    ['gpos50', '#999', '#AAA', '#888'],
    ['gpos66', '#888', '#888', '#666'],
    ['gpos75', '#777', '#777', '#444'],
    ['gpos100', '#444', '#666', '#000'],
    ['acen', '#FEE', '#FEE', '#FDD'],
    ['noBands', '#BBB', '#BBB', '#AAA']
  ];

  for (var i = 0; i < colors.length; i++) {
    stain = colors[i][0];
    color1 = colors[i][1];
    color2 = colors[i][2];
    color3 = colors[i][3];
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

  css = '<style>' +
    'svg#_ideogram  {padding-left: 5px;} ' +
    'svg#_ideogram .labeled {padding-left: 15px;} ' +
    'svg#_ideogram.labeledLeft {padding-left: 15px; padding-top: 15px;} ' +
    // Tahoma has great readability and space utilization at small sizes
    // More: http://ux.stackexchange.com/a/3334
    '#_ideogram text {font: 9px Tahoma; fill: #000;} ' +
    '#_ideogram .italic {font-style: italic;} ' +
    // Fill below is fallback for IE11
    '#_ideogram .chromosome {cursor: pointer; fill: #AAA;}' +
    '#_ideogram .chrSetLabel {font-weight: bolder;}' +
    '#_ideogram .ghost {opacity: 0.2;}' +
    '#_ideogram .hidden {display: none;}' +
    '#_ideogram .bandLabelStalk line {stroke: #AAA; stroke-width: 1;}' +
    '#_ideogram .syntenyBorder {stroke:#AAA;stroke-width:1;}' +
    '#_ideogram .brush .selection {' +
    '  fill: #F00;' +
    '  stroke: #F00;' +
    '  fill-opacity: .3;' +
    '  shape-rendering: crispEdges;' +
    '}' +
    '#_ideogram .noBands {fill: #AAA;}' +
    // NCBI stain density colors
    '#_ideogram .gneg {fill: #FFF}' +
    '#_ideogram .gpos25 {fill: #BBB}' +
    '#_ideogram .gpos33 {fill: #AAA}' +
    '#_ideogram .gpos50 {fill: #888}' +
    '#_ideogram .gpos66 {fill: #666}' +
    '#_ideogram .gpos75 {fill: #444}' +
    '#_ideogram .gpos100 {fill: #000}' +
    '#_ideogram .gpos {fill: #000}' +
    '#_ideogram .acen {fill: #FDD}' +
    '#_ideogram .stalk {fill: #CCE;}' +
    '#_ideogram .gvar {fill: #DDF}' +
    // Used when overlaid with annotations
    '#_ideogram.faint .gneg {fill: #FFF}' +
    '#_ideogram.faint .gpos25 {fill: #EEE}' +
    '#_ideogram.faint .gpos33 {fill: #EEE}' +
    '#_ideogram.faint .gpos50 {fill: #EEE}' +
    '#_ideogram.faint .gpos66 {fill: #EEE}' +
    '#_ideogram.faint .gpos75 {fill: #EEE}' +
    '#_ideogram.faint .gpos100 {fill: #DDD}' +
    '#_ideogram.faint .gpos {fill: #DDD}' +
    '#_ideogram.faint .acen {fill: #FEE}' +
    '#_ideogram.faint .stalk {fill: #EEF;}' +
    '#_ideogram.faint .gvar {fill: #EEF}' +
    '#_ideogram .gneg {fill: url("#gneg")} ' +
    '#_ideogram .gpos25 {fill: url("#gpos25")} ' +
    '#_ideogram .gpos33 {fill: url("#gpos33")} ' +
    '#_ideogram .gpos50 {fill: url("#gpos50")} ' +
    '#_ideogram .gpos66 {fill: url("#gpos66")} ' +
    '#_ideogram .gpos75 {fill: url("#gpos75")} ' +
    '#_ideogram .gpos100 {fill: url("#gpos100")} ' +
    '#_ideogram .gpos {fill: url("#gpos100")} ' +
    '#_ideogram .acen {fill: url("#acen")} ' +
    '#_ideogram .stalk {fill: url("#stalk")} ' +
    '#_ideogram .gvar {fill: url("#gvar")} ' +
    '#_ideogram .noBands {fill: url("#noBands")} ' +
    '#_ideogram .chromosome {fill: url("#noBands")} ' +
    '</style>';

  gradients +=
    '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse" ' +
    'patternTransform="rotate(30 0 0)">' +
    '<rect x="0" y="0" width="10" height="2" fill="#CCE" /> ' +
    '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B; ' +
    'stroke-width:0.7;" />' +
    '</pattern>' +
    '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse" ' +
    'patternTransform="rotate(-30 0 0)">' +
    '<rect x="0" y="0" width="10" height="2" fill="#DDF" /> ' +
    '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C; ' +
    'stroke-width:0.7;" />' +
    '</pattern>';
  gradients = "<defs>" + gradients + "</defs>";
  gradients = css + gradients;

  return gradients;
}

/**
 * Completes default ideogram initialization by calling downstream functions
 * to process raw band data into full JSON objects, render chromosome and
 * cytoband figures and labels, apply initial graphical transformations,
 * hide overlapping band labels, and execute callbacks defined by client code
 */
function processBandData() {
  var bandsArray, i, j, k, chromosome, bands,
    chrLength, chr,
    bandData, bandsByChr,
    taxid, taxids, chrs, chrsByTaxid,
    ideo = this;

  bandsArray = [];

  if (ideo.config.multiorganism === true) {
    ideo.coordinateSystem = 'bp';
    taxids = ideo.config.taxids;
    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];
    }
  } else {
    if (typeof ideo.config.taxid === 'undefined') {
      ideo.config.taxid = ideo.config.taxids[0];
    }
    taxid = ideo.config.taxid;
    taxids = [taxid];
    ideo.config.taxids = taxids;
  }

  if ('chromosomes' in ideo.config) {
    chrs = ideo.config.chromosomes;
  }
  if (ideo.config.multiorganism) {
    chrsByTaxid = chrs;
  }

  ideo.config.chromosomes = {};

  var t0B = new Date().getTime();

  for (j = 0; j < taxids.length; j++) {
    taxid = taxids[j];

    if (ideo.config.multiorganism) {
      chrs = chrsByTaxid[taxid];
    }

    if (ideo.coordinateSystem === 'iscn' || ideo.config.multiorganism) {
      bandData = ideo.bandData[taxid];

      bandsByChr = ideo.getBands(bandData, taxid, chrs);

      chrs = Object.keys(bandsByChr).sort(function(a, b) {
        return Ideogram.naturalSort(a, b);
      });

      ideo.config.chromosomes[taxid] = chrs.slice();
      ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

      for (k = 0; k < chrs.length; k++) {
        chromosome = chrs[k];
        bands = bandsByChr[chromosome];
        bandsArray.push(bands);

        chrLength = {
          iscn: bands[bands.length - 1].iscn.stop,
          bp: bands[bands.length - 1].bp.stop
        };

        if (chrLength.iscn > ideo.maxLength.iscn) {
          ideo.maxLength.iscn = chrLength.iscn;
        }

        if (chrLength.bp > ideo.maxLength.bp) {
          ideo.maxLength.bp = chrLength.bp;
        }
      }
    } else if (ideo.coordinateSystem === 'bp') {
      // If lacking band-level data

      ideo.config.chromosomes[taxid] = chrs.slice();
      ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

      for (k = 0; k < chrs.length; k++) {
        chr = chrs[k];
        if (chr.length > ideo.maxLength.bp) {
          ideo.maxLength.bp = chr.length;
        }
      }
    }
  }

  var t1B = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in processBandData: ' + (t1B - t0B) + ' ms');
  }

  return bandsArray;
}

export {
  getBands, drawBandLabels, getBandColorGradients, processBandData,
  setBandsToShow, hideUnshownBandLabels
}