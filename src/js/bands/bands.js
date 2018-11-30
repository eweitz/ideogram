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

import naturalSort from 'es6-natural-sort';

import {
  drawBandLabels, getBandColorGradients, hideUnshownBandLabels, setBandsToShow,
  drawBandLabelText, drawBandLabelStalk
} from './draw';
import {parseBands} from './parse';

/**
 * TODO: Should this be in services/organism.js?
 */
function setTaxids(ideo) {
  var i, taxid, taxids;

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

  return [taxid, taxids];
}

/**
 * Updates bands array, sets ideo.maxLength
 */
function updateBandsArray(chromosome, bandsByChr, bandsArray, ideo) {
  var bands, chrLength;

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

  return bandsArray;
}

/**
 * Updates bandsArray, sets ideo.config.chromosomes and ideo.numChromosomes
 */
function setChrsByTaxidsWithBands(taxid, chrs, bandsArray, ideo) {
  var bandData, bandsByChr, chromosome, k;

  bandData = ideo.bandData[taxid];

  bandsByChr = ideo.parseBands(bandData, taxid, chrs);

  chrs = Object.keys(bandsByChr).sort(function(a, b) {
    return naturalSort(a, b);
  });

  ideo.config.chromosomes[taxid] = chrs.slice();
  ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

  for (k = 0; k < chrs.length; k++) {
    chromosome = chrs[k];
    bandsArray = updateBandsArray(chromosome, bandsByChr, bandsArray, ideo);
  }

  return bandsArray;
}

function setChromosomesByTaxid(taxid, chrs, bandsArray, ideo) {
  var chr, k;

  if (ideo.coordinateSystem === 'iscn' || ideo.config.multiorganism) {
    bandsArray = setChrsByTaxidsWithBands(taxid, chrs, bandsArray, ideo);
  } else if (ideo.coordinateSystem === 'bp') {
    // If lacking band-level data
    ideo.config.chromosomes[taxid] = chrs.slice();
    ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

    for (k = 0; k < chrs.length; k++) {
      chr = chrs[k];
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
function processBandData() {
  var bandsArray, j, taxid, taxids, chrs, chrsByTaxid,
    t0 = new Date().getTime(),
    ideo = this;

  bandsArray = [];

  [taxid, taxids] = setTaxids(ideo);

  if ('chromosomes' in ideo.config) chrs = ideo.config.chromosomes;
  if (ideo.config.multiorganism) chrsByTaxid = chrs;
  ideo.config.chromosomes = {};

  for (j = 0; j < taxids.length; j++) {
    taxid = taxids[j];
    if (ideo.config.multiorganism) chrs = chrsByTaxid[taxid];
    bandsArray = setChromosomesByTaxid(taxid, chrs, bandsArray, ideo);
  }

  reportPerformance(t0, ideo);
  return bandsArray;
}

export {
  parseBands, drawBandLabels, getBandColorGradients, processBandData,
  setBandsToShow, hideUnshownBandLabels, drawBandLabelText, drawBandLabelStalk
}