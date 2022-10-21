import {d3} from '../lib';
import collinearizeChromosomes from '../collinear';
import {initCaches} from './caches/cache';

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
 * Load (potentially large) annotation dataset, then process it.
 */
function waitForAndProcessAnnots(ideo) {
  if (ideo.rawAnnots) {
    processAnnots(ideo);
  } else {
    (function checkAnnotData() {
      ideo.timeout = setTimeout(function() {
        if (
          !ideo.rawAnnots ||
          (ideo.rawAnnots && typeof ideo.rawAnnots.then !== 'undefined')
        ) {
          // Ensure rawAnnots is defined and not a Promise (not "then"-able)
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
function finishInit(t0) {
  var t0A = new Date().getTime(),
    ideo = this,
    config = ideo.config,
    confAnnots = config.annotations;

  ideo.initDrawChromosomes();

  if (config.annotationsPath) waitForAndProcessAnnots(ideo);

  processLabels(config, ideo);

  // Create a brush or a click cursor if specified
  if (config.brush) ideo.createBrush(config.brush);
  else if (config.cursorPosition) ideo.createClickCursor(config.cursorPosition);

  if (confAnnots) {
    if (Array.isArray(confAnnots)) {
      ideo.drawAnnots(confAnnots);
    } else {
      // Enable client-side-defined annotations to be formatted
      // like the wider variety of server-side-defined annotations.
      // Supports https://github.com/eweitz/ideogram/issues/137
      ideo.rawAnnots = confAnnots;
      ideo.afterRawAnnots();
      processAnnots(ideo);
    }
  }

  reportDebugTimings(config, t0, t0A);

  ideo.setOverflowScroll();

  if (config.geometry === 'collinear') collinearizeChromosomes(ideo);

  if (ideo.config.debug) console.time('initCache: Ideogram');
  initCaches(ideo).then(() => {
    if (ideo.config.debug) console.timeEnd('initCache: Ideogram');
    if (ideo.onLoadCallback) ideo.onLoadCallback();
  });
}

export {finishInit};
