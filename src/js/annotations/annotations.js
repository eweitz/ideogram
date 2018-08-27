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
import {
  restoreDefaultTracks, setOriginalTrackIndexes, updateDisplayedTracks
} from './filter';
import {processAnnotData} from './process'

var d3 = Object.assign({}, d3selection, d3fetch);

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

    // Ensure annots are ordered by chromosome
    ideo.rawAnnots.annots = rawAnnots.annots.sort(function(a, b) {
      return Ideogram.naturalSort(a.chr, b.chr);
    });

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
  showAnnotTooltip, onWillShowAnnotTooltip, setOriginalTrackIndexes
}
