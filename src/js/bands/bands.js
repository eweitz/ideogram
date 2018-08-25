/**
 * @fileoverview Methods for processing chromosome length and banding data.
 *
 * Ideogram.js depicts chromosomes using data on their length, name, and
 * (if dealing with a very well-studied organism) cytogenetic banding data.
 * This file processes cytoband data that comes from biological research
 * institutions.
 *
 * For background on cytogenetic bands and how they are used in genomics, see:
 * https://ghr.nlm.nih.gov/primer/howgeneswork/genelocation
 *
 */

import {
  drawBandLabels, getBandColorGradients, hideUnshownBandLabels, setBandsToShow,
  drawBandLabelText, drawBandLabelStalk
} from './draw'

import * as d3selection from 'd3-selection';

import {Object} from '../lib.js';

var d3 = Object.assign({}, d3selection);

/**
 * Parses cytogenetic band data from a TSV file, or, if band data is
 * prefetched, from an array
 *
 * NCBI:
 * #chromosome arm band iscn_start iscn_stop bp_start bp_stop stain density
 * ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
 */
function parseBands(content, taxid, chromosomes) {
  var lines = {},
    delimiter, tsvLines, columns, line, stain, chr,
    i, init, tsvLinesLength, source, tmp;

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

      bandsByChr = ideo.parseBands(bandData, taxid, chrs);

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
  parseBands, drawBandLabels, getBandColorGradients, processBandData,
  setBandsToShow, hideUnshownBandLabels, drawBandLabelText, drawBandLabelStalk
}