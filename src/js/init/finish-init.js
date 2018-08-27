import * as d3selection from 'd3-selection';
import {Object} from '../lib';

var d3 = Object.assign({}, d3selection);

/**
 * Completes high-level initialization.
 * Draws chromosomes and band labels, rotating as needed;
 * processes and draws annotations;
 * creates brush, emits notification of load completion, etc.
 */
function finishInit(bandsArray, t0) {
  var i, 
    t0A = new Date().getTime(),
    ideo = this,
    config = ideo.config;

  try {

    ideo.initDrawChromosomes(bandsArray);

    // Waits for potentially large annotation dataset
    // to be received by the client, then triggers annotation processing
    if (config.annotationsPath) {
      function pa() {
        if (typeof ideo.timeout !== 'undefined') {
          window.clearTimeout(ideo.timeout);
        }

        ideo.rawAnnots = ideo.setOriginalTrackIndexes(ideo.rawAnnots);

        if (config.annotationsDisplayedTracks) {
          ideo.annots = ideo.updateDisplayedTracks(config.annotationsDisplayedTracks);
        } else {
          ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

          if (config.filterable) {
            ideo.initCrossFilter();
          }

          ideo.drawProcessedAnnots(ideo.annots);
        }
      }

      if (ideo.rawAnnots) {
        pa();
      } else {
        (function checkAnnotData() {
          ideo.timeout = setTimeout(function() {
              if (!ideo.rawAnnots) {
                checkAnnotData();
              } else {
                pa();
              }
            },
            50
          );
        })();
      }
    }

    if (config.showBandLabels === true) {
      ideo.hideUnshownBandLabels();
      var t1C = new Date().getTime();
      if (config.debug) {
        console.log('Time in showing bands: ' + (t1C - t0C) + ' ms');
      }

      if (config.orientation === 'vertical') {
        var chrID;
        for (i = 0; i < ideo.chromosomesArray.length; i++) {
          chrID = '#' + ideo.chromosomesArray[i].id;
          ideo.rotateChromosomeLabels(d3.select(chrID), i);
        }
      }
    }

    if (config.showChromosomeLabels === true) {
      ideo.drawChromosomeLabels(ideo.chromosomes);
    }

    if (config.brush) {
      ideo.createBrush(config.brush);
    }

    if (config.annotations) {
      ideo.drawAnnots(config.annotations);
    }

    var t1A = new Date().getTime();
    if (config.debug) {
      console.log('Time in drawChromosome: ' + (t1A - t0A) + ' ms');
    }

    var t1 = new Date().getTime();
    if (config.debug) {
      console.log('Time constructing ideogram: ' + (t1 - t0) + ' ms');
    }

    ideo.setOverflowScroll();

    if (ideo.onLoadCallback) {
      ideo.onLoadCallback();
    }
  } catch (e) {
    // console.log(e);
    throw e;
  }
}

export {finishInit}