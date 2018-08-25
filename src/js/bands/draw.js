import * as d3selection from 'd3-selection';
import {Object} from '../lib.js';
import {hideUnshownBandLabels, setBandsToShow} from './show.js';

var d3 = Object.assign({}, d3selection);

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
      .attr('class', function (d, i) {
        return 'bandLabel bsbsl-' + i;
      })
      .attr('transform', function (d) {
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
      .text(function (d) {
        return d.name;
      });

    // var adapter = ModelAdapter.getInstance(ideo.chromosomesArray[i]);
    // var view = Chromosome.getInstance(adapter, ideo.config, ideo);

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
      .attr('y1', function () {
        return ideo._layout.getChromosomeBandTickY1(i);
      })
      .attr('x2', 0)
      .attr('y2', function () {
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

export {
  drawBandLabels, getBandColorGradients, hideUnshownBandLabels, setBandsToShow
}