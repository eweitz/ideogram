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
} from './draw';
import {parseBands} from './parse';
import {organismMetadata} from '../init/organism-metadata';

/**
 * Gets bands array for given chromosomes, sets ideo.maxLength
 */
function getBandsArray(chromosome, bandsByChr, taxid, ideo) {
  var bands, chrLength,
    bandsArray = [];

  bands = bandsByChr[chromosome];
  bandsArray.push(bands);

  chrLength = {
    iscn: bands[bands.length - 1].iscn.stop,
    bp: bands[bands.length - 1].bp.stop
  };

  if (taxid in ideo.maxLength === false) {
    ideo.maxLength[taxid] = {bp: 0, iscn: 0};
  }

  if (chrLength.iscn > ideo.maxLength[taxid].iscn) {
    ideo.maxLength[taxid].iscn = chrLength.iscn;
    if (chrLength.iscn > ideo.maxLength.iscn) {
      ideo.maxLength.iscn = chrLength.iscn;
    }
  }

  if (chrLength.bp > ideo.maxLength[taxid].bp) {
    ideo.maxLength[taxid].bp = chrLength.bp;
    if (chrLength.bp > ideo.maxLength.bp) {
      ideo.maxLength.bp = chrLength.bp;
    }
  }

  return bandsArray;
}

/**
 * Updates bandsArray, sets ideo.config.chromosomes and ideo.numChromosomes
 */
function setChrsByTaxidsWithBands(taxid, chrs, bandsArray, ideo) {
  var bandsByChr, chromosome, k, chrBandsArray;

  bandsByChr = parseBands(taxid, chrs, ideo);

  chrs = Object.keys(bandsByChr).sort(function(a, b) {
    return a.localeCompare(b, 'en', {numeric: true});
  });

  if (
    'chromosomes' in ideo.config === false ||
    ideo.config.chromosomes === null
  ) {
    ideo.config.chromosomes = {};
  }
  if (chrs.length > 0) {
    ideo.config.chromosomes[taxid] = chrs.slice();
  }
  ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

  for (k = 0; k < chrs.length; k++) {
    chromosome = chrs[k];
    chrBandsArray = getBandsArray(chromosome, bandsByChr, taxid, ideo);
    bandsArray = bandsArray.concat(chrBandsArray);
  }

  return bandsArray;
}

function setChromosomesByTaxid(taxid, chrs, bandsArray, ideo) {
  var chr, i;

  if (
    taxid in ideo.bandData ||
    taxid in organismMetadata &&
    ideo.assemblyIsAccession() === false
  ) {
    bandsArray = setChrsByTaxidsWithBands(taxid, chrs, bandsArray, ideo);
  } else {
    // If lacking band-level data
    ideo.numChromosomes += chrs.length;

    for (i = 0; i < chrs.length; i++) {
      chr = chrs[i];
      if (chr.length > ideo.maxLength.bp) ideo.maxLength.bp = chr.length;
    }
  }

  return bandsArray;
}

function reportPerformance(t0, ideo) {
  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in processBandData: ' + (t1 - t0) + ' ms');
  }
}

/**
 * Completes default ideogram initialization by calling downstream functions
 * to process raw band data into full JSON objects, render chromosome and
 * cytoband figures and labels, apply initial graphical transformations,
 * hide overlapping band labels, and execute callbacks defined by client code
 */
function processBandData(taxid) {
  var bandsArray, chrs,
    ideo = this,
    config = ideo.config,
    t0 = new Date().getTime();

  bandsArray = [];

  if ('chromosomes' in config) {
    if (config.multiorganism) {
      // Copy object
      chrs = config.chromosomes;
    } else if (taxid in config.chromosomes) {
      // Copy array by value
      chrs = config.chromosomes[taxid].slice();
    } else {
      // Copy array by value.  Needed for e.g. "Homology, basic"
      chrs = config.chromosomes.slice();
    }
  }

  bandsArray = setChromosomesByTaxid(taxid, chrs, bandsArray, ideo);

  reportPerformance(t0, ideo);
  return [taxid, bandsArray];
}

export {
  drawBandLabels, getBandColorGradients, processBandData,
  setBandsToShow, hideUnshownBandLabels, drawBandLabelText, drawBandLabelStalk
};
