/**
 * @fileoverview Methods for ideogram annotations.
 * Annotations are graphical objects that represent features of interest
 * located on the chromosomes, e.g. genes or variations.  They can
 * appear beside a chromosome, overlaid on top of it, or between multiple
 * chromosomes.
 */

import * as d3selection from 'd3-selection';
import * as d3fetch from 'd3-fetch';

import {BedParser} from '../parsers/bed-parser';
import {Object} from '../lib.js';
import {
  drawHeatmaps, deserializeAnnotsForHeatmap
} from './heatmap';
import {
  onLoadAnnots, onDrawAnnots, startHideAnnotTooltipTimeout,
  onWillShowAnnotTooltip, showAnnotTooltip
} from './events';
import {drawAnnots, drawProcessedAnnots} from './draw';
import {getHistogramBars} from './histogram';
import {drawSynteny} from './synteny';

var d3 = Object.assign({}, d3selection, d3fetch);

/**
 * Proccesses genome annotation data.
 *
 * This method converts raw annotation data from server, which is structured as
 * an array of arrays, into a more verbose data structure consisting of an
 * array of objects.  It also adds pixel offset information.
 */
function processAnnotData(rawAnnots) {
  var keys, numTracks, i, j, k, m, n, annot, annots, thisAnnot, annotsByChr, chr, chrs,
    chrModel, ra, startPx, stopPx, px, annotTrack, color, shape,
    unorderedAnnots, colorMap, omittedAnnots, numOmittedTracks,
    ideo = this,
    config = ideo.config;

  omittedAnnots = {};

  colorMap = [
    ['F00'],
    ['F00', '88F'],
    ['F00', 'CCC', '88F'],
    ['F00', 'FA0', '0AF', '88F'],
    ['F00', 'FA0', 'CCC', '0AF', '88F'],
    ['F00', 'FA0', '875', '578', '0AF', '88F'],
    ['F00', 'FA0', '875', 'CCC', '578', '0AF', '88F'],
    ['F00', 'FA0', '7A0', '875', '0A7', '578', '0AF', '88F'],
    ['F00', 'FA0', '7A0', '875', 'CCC', '0A7', '578', '0AF', '88F'],
    ['F00', 'FA0', '7A0', '875', '552', '255', '0A7', '578', '0AF', '88F']
  ];

  keys = rawAnnots.keys;
  rawAnnots = rawAnnots.annots;

  numTracks = config.numAnnotTracks;

  if (numTracks > 10) {
    console.error(
      'Ideogram only displays up to 10 tracks at a time.  ' +
      'You specified ' + numTracks + ' tracks.  ' +
      'Perhaps consider a different way to visualize your data.'
    );
  }

  annots = [];

  m = -1;
  for (i = 0; i < rawAnnots.length; i++) {

    annotsByChr = rawAnnots[i];

    chr = annotsByChr.chr;
    chrModel = ideo.chromosomes[config.taxid][chr];

    if (typeof chrModel === 'undefined') {
      console.warn(
        'Chromosome "' + chr + '" undefined in ideogram; ' +
        annotsByChr.annots.length + ' annotations not shown'
      );
      continue;
    }

    m++;
    annots.push({chr: annotsByChr.chr, annots: []});

    for (j = 0; j < annotsByChr.annots.length; j++) {
      ra = annotsByChr.annots[j];
      annot = {};

      for (k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot.stop = annot.start + annot.length;

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);

      px = Math.round((startPx + stopPx) / 2);

      color = config.annotationsColor;

      if ('color' in annot && !config.annotationTracks) {
        color = annot.color;
        annot.color = color;
        annot.shape = shape;
      }

      if ('shape' in annot) {
        shape = annot.shape;
      }

      annot.chr = chr;
      annot.chrIndex = i;
      annot.px = px;
      annot.startPx = startPx;
      annot.stopPx = stopPx;

      if (config.annotationTracks) {
        // Client annotations, as in annotations-tracks.html
        annot.trackIndex = ra[3];
        annotTrack = config.annotationTracks[annot.trackIndex];
        if (annotTrack.color) {
          annot.color = annotTrack.color;
        }
        annot.shape = annotTrack.shape;
        annots[m].annots.push(annot);
      } else if (keys[3] === 'trackIndex' && numTracks !== 1) {
        // Sparse server annotations, as in annotations-track-filters.html
        annot.trackIndex = ra[3];
        annot.color = '#' + colorMap[numTracks - 1][annot.trackIndex];

        // Catch annots that will be omitted from display
        if (annot.trackIndex > numTracks - 1) {
          if (annot.trackIndex in omittedAnnots) {
            omittedAnnots[annot.trackIndex].push(annot);
          } else {
            omittedAnnots[annot.trackIndex] = [annot];
          }
          continue;
        }
        annots[m].annots.push(annot);
      } else if (
        keys.length > 3 &&
        keys[3] in {trackIndex: 1, color: 1, shape: 1} === false
      ) {
        // Dense server annotations
        for (n = 3; n < keys.length; n++) {
          thisAnnot = Object.assign({}, annot);
          thisAnnot.trackIndex = n - 3;
          thisAnnot.color = '#' + colorMap[numTracks - 1][thisAnnot.trackIndex];
          annots[m].annots.push(thisAnnot);
        }
      } else {
        // Basic annotations, as in annotations-basic.html,
        // and annotations-external.html
        annot.trackIndex = 0;
        if (!annot.color) {
          annot.color = config.annotationsColor;
        }
        if (!annot.shape) {
          annot.shape = 'triangle';
        }
        annots[m].annots.push(annot);
      }
    }
  }

  numOmittedTracks = Object.keys(omittedAnnots).length;
  if (numOmittedTracks) {
    console.warn(
      'Ideogram configuration specified ' + numTracks + ' tracks, ' +
      'but loaded annotations contain ' + numOmittedTracks + ' ' +
      'extra tracks.'
    );
  }

  // Ensure annotation containers are ordered by chromosome
  unorderedAnnots = annots;
  annots = [];
  chrs = ideo.chromosomesArray;
  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i].name;
    for (j = 0; j < unorderedAnnots.length; j++) {
      annot = unorderedAnnots[j];
      if (annot.chr === chr) {
        annots.push(annot);
      }
    }
  }

  return annots;
}

/**
 * Reset displayed tracks to the originally displayed
 */
function restoreDefaultTracks() {
  var ideo = this;
  ideo.config.numAnnotTracks = ideo.config.annotationsNumTracks;
  d3.selectAll(ideo.selector + ' .annot').remove();
  ideo.drawAnnots(ideo.processAnnotData(ideo.rawAnnots));
}

/**
 * Adds or removes tracks from the displayed list of tracks.
 * Only works when raw annotations are dense.
 *
 * @param trackIndexes Array of indexes of tracks to display
 */
function updateDisplayedTracks(trackIndexes) {
  var displayedRawAnnotsByChr, displayedAnnots, i, j, rawAnnots, annots, annot,
    trackIndex,
    ideo = this,
    annotsByChr = ideo.rawAnnots.annots;

  displayedRawAnnotsByChr = [];

  ideo.config.numAnnotTracks = trackIndexes.length;

  // Filter displayed tracks by selected track indexes
  for (i = 0; i < annotsByChr.length; i++) {
    annots = annotsByChr[i];
    displayedAnnots = [];
    for (j = 0; j < annots.annots.length; j++) {
      annot = Object.assign({}, annots.annots[j]); // copy by value
      trackIndex = annot[3] + 1;
      if (trackIndexes.includes(trackIndex)) {
        annot[3] = trackIndexes.indexOf(trackIndex);
        displayedAnnots.push(annot);
      }
    }
    displayedRawAnnotsByChr.push({chr: annots.chr, annots: displayedAnnots});
  }

  rawAnnots = {keys: ideo.rawAnnots.keys, annots: displayedRawAnnotsByChr};
  displayedAnnots = ideo.processAnnotData(rawAnnots);

  d3.selectAll(ideo.selector + ' .annot').remove();
  ideo.drawAnnots(displayedAnnots);
}

/**
 * Initializes various annotation settings.  Constructor help function.
 */
function initAnnotSettings() {
  var ideo = this,
    config = ideo.config;

  if (
    config.annotationsPath || config.localAnnotationsPath ||
    ideo.annots || config.annotations
  ) {
    if (!config.annotationHeight) {
      var annotHeight = Math.round(config.chrHeight / 100);
      this.config.annotationHeight = annotHeight;
    }

    if (config.annotationTracks) {
      this.config.numAnnotTracks = config.annotationTracks.length;
    } else if (config.annotationsNumTracks) {
      this.config.numAnnotTracks = config.annotationsNumTracks;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight =
      config.annotationHeight * config.numAnnotTracks;

    if (typeof config.barWidth === 'undefined') {
      this.config.barWidth = 3;
    }
  } else {
    this.config.annotTracksHeight = 0;
  }

  if (typeof config.annotationsColor === 'undefined') {
    this.config.annotationsColor = '#F00';
  }

  if (config.showAnnotTooltip !== false) {
    this.config.showAnnotTooltip = true;
  }

  if (config.onWillShowAnnotTooltip) {
    this.onWillShowAnnotTooltipCallback = config.onWillShowAnnotTooltip;
  }

  if (config.annotationsLayout === 'heatmap') {
    // window.onresize = function() {
    //   ideo.drawHeatmaps(ideo.annots);
    // };

    // ideo.isScrolling = null;

    // Listen for scroll events
    // window.addEventListener('scroll', function ( event ) {
    //
    //   // Clear our timeout throughout the scroll
    //   window.clearTimeout( ideo.isScrolling );
    //
    //   // Set a timeout to run after scrolling ends
    //   ideo.isScrolling = setTimeout(function() {
    //
    //     // Run the callback
    //     console.log('Scrolling has stopped.');
    //     ideo.drawHeatmaps(ideo.annots);
    //
    //   }, 300);
    //
    // // }, false);
    //
    // window.onscroll = function() {
    //   ideo.drawHeatmaps(ideo.annots);
    //   // console.log('onscroll')
    // };
  }

}

/**
 * Requests annotations URL via HTTP, sets ideo.rawAnnots for downstream
 * processing.
 *
 * @param annotsUrl Absolute or relative URL native or BED annotations file
 */
function fetchAnnots(annotsUrl) {

  var tmp, extension,
    ideo = this;

  function afterRawAnnots(rawAnnots) {
    if (ideo.config.heatmaps) {
      ideo.deserializeAnnotsForHeatmap(rawAnnots);
    }
    if (ideo.onLoadAnnotsCallback) {
      ideo.onLoadAnnotsCallback();
    }
  }

  if (annotsUrl.slice(0, 4) !== 'http') {
    d3.json(ideo.config.annotationsPath)
      .then(function(data) {
        ideo.rawAnnots = data;
        afterRawAnnots(ideo.rawAnnots);
      });
    return;
  }

  tmp = annotsUrl.split('?')[0].split('.');
  extension = tmp[tmp.length - 1];

  if (extension !== 'bed' && extension !== 'json') {
    extension = extension.toUpperCase();
    alert(
      'Ideogram.js only supports BED and Ideogram JSON at the moment.  ' +
      'Sorry, check back soon for ' + extension + ' support!'
    );
    return;
  }

  d3.text(annotsUrl).then(function(text) {
    if (extension === 'bed') {
      ideo.rawAnnots = new BedParser(text, ideo).rawAnnots;
    } else {
      ideo.rawAnnots = JSON.parse(text);
    }
    afterRawAnnots(ideo.rawAnnots);
  });

}

/**
 * Fills out annotations data structure such that its top-level list of arrays
 * matches that of this ideogram's chromosomes list in order and number
 * Fixes https://github.com/eweitz/ideogram/issues/66
 */
function fillAnnots(annots) {
  var filledAnnots, chrs, chrArray, i, chr, annot, chrIndex;

  filledAnnots = [];
  chrs = [];
  chrArray = this.chromosomesArray;

  for (i = 0; i < chrArray.length; i++) {
    chr = chrArray[i].name;
    chrs.push(chr);
    filledAnnots.push({chr: chr, annots: []});
  }

  for (i = 0; i < annots.length; i++) {
    annot = annots[i];
    chrIndex = chrs.indexOf(annot.chr);
    if (chrIndex !== -1) {
      filledAnnots[chrIndex] = annot;
    }
  }

  return filledAnnots;
}

export {
  onLoadAnnots, onDrawAnnots, processAnnotData, restoreDefaultTracks,
  updateDisplayedTracks, initAnnotSettings, fetchAnnots, drawAnnots,
  getHistogramBars, drawHeatmaps, deserializeAnnotsForHeatmap, fillAnnots,
  drawProcessedAnnots, drawSynteny, startHideAnnotTooltipTimeout,
  showAnnotTooltip, onWillShowAnnotTooltip
}
