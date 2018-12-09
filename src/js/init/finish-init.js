import * as d3selection from 'd3-selection';
import {Object} from '../lib';
import collinearizeChromosomes from '../collinear'

var d3 = Object.assign({}, d3selection);

function processLabels(config, ideo) {
  var i, chrID, t0C, t1C;

  if (config.showBandLabels === true) {
    t0C = new Date().getTime();
    ideo.hideUnshownBandLabels();
    t1C = new Date().getTime();
    if (config.debug) {
      console.log('Time in showing bands: ' + (t1C - t0C) + ' ms');
    }

    if (config.orientation === 'vertical') {
      for (i = 0; i < ideo.chromosomesArray.length; i++) {
        chrID = '#' + ideo.chromosomesArray[i].id;
        ideo.rotateChromosomeLabels(d3.select(chrID), i);
      }
    }
  }

  if (config.showChromosomeLabels === true) {
    ideo.drawChromosomeLabels(ideo.chromosomes);
  }
}

function processAnnots(ideo) {
  if (typeof ideo.timeout !== 'undefined') window.clearTimeout(ideo.timeout);

  ideo.rawAnnots = ideo.setOriginalTrackIndexes(ideo.rawAnnots);

  if (ideo.config.annotationsDisplayedTracks) {
    ideo.annots =
      ideo.updateDisplayedTracks(ideo.config.annotationsDisplayedTracks);
  } else {
    ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
    if (ideo.config.filterable) ideo.initCrossFilter();
    ideo.drawProcessedAnnots(ideo.annots);
  }
}

/**
 * Waits for potentially large annotation dataset
 * to be received by the client, then triggers annotation processing.
 */
function waitForAndProcessAnnots(ideo) {
  if (ideo.rawAnnots) {
    processAnnots(ideo);
  } else {
    (function checkAnnotData() {
      ideo.timeout = setTimeout(function() {
        if (!ideo.rawAnnots) {
          checkAnnotData();
        } else {
          processAnnots(ideo);
        }
      }, 50);
    })();
  }
}

function reportDebugTimings(config, t0, t0A) {

  var t1A = new Date().getTime();
  if (config.debug) {
    console.log('Time in drawChromosome: ' + (t1A - t0A) + ' ms');
  }

  var t1 = new Date().getTime();
  if (config.debug) {
    console.log('Time constructing ideogram: ' + (t1 - t0) + ' ms');
  }
}

/**
 * Completes high-level initialization.
 * Draws chromosomes and band labels, rotating as needed;
 * processes and draws annotations;
 * creates brush, emits notification of load completion, etc.
 */
function finishInit(bandsArray, t0) {
  var t0A = new Date().getTime(),
    ideo = this,
    config = ideo.config;

  ideo.initDrawChromosomes(bandsArray);

  if (config.annotationsPath) waitForAndProcessAnnots(ideo);

  processLabels(config, ideo);

  if (config.brush) ideo.createBrush(config.brush);
  if (config.annotations) ideo.drawAnnots(config.annotations);

  reportDebugTimings(config, t0, t0A);

  ideo.setOverflowScroll();

  if (
    ideo.config.geometry === 'collinear' &&
    ideo.config.orientation === 'horizontal'
  ) {
    collinearizeChromosomes();
  }

  if (ideo.onLoadCallback) ideo.onLoadCallback();
}

export {finishInit}