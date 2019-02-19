/**
 * @fileoverview Methods for ideogram annotations.
 * Annotations are graphical objects that represent features of interest
 * located on the chromosomes, e.g. genes or variations.  They can
 * appear beside a chromosome, overlaid on top of it, or between multiple
 * chromosomes.
 */


import naturalSort from 'es6-natural-sort';

import {d3} from '../lib';
import {BedParser} from '../parsers/bed-parser';
import {drawHeatmaps, deserializeAnnotsForHeatmap} from './heatmap';
import {inflateThresholds} from './heatmap-lib';
import {inflateHeatmaps} from './heatmap-collinear';
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
import { ExpressionMatrixParser } from '../parsers/expression-matrix-parser';

function initNumTracksHeightAndBarWidth(ideo, config) {
  var annotHeight;

  if (!config.annotationHeight) {
    if (config.annotationsLayout === 'heatmap') {
      annotHeight = config.chrWidth - 1;
    } else {
      annotHeight = Math.round(config.chrHeight / 100);
    }
    ideo.config.annotationHeight = annotHeight;
  }

  if (config.annotationTracks) {
    ideo.config.numAnnotTracks = config.annotationTracks.length;
  } else if (config.annotationsNumTracks) {
    ideo.config.numAnnotTracks = config.annotationsNumTracks;
  } else {
    ideo.config.numAnnotTracks = 1;
  }
  ideo.config.annotTracksHeight =
    config.annotationHeight * config.numAnnotTracks;

  if (typeof config.barWidth === 'undefined') {
    ideo.config.barWidth = 3;
  }
}

function initTooltip(ideo, config) {
  if (config.showAnnotTooltip !== false) {
    ideo.config.showAnnotTooltip = true;
  }

  if (config.onWillShowAnnotTooltip) {
    ideo.onWillShowAnnotTooltipCallback = config.onWillShowAnnotTooltip;
  }
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
    initNumTracksHeightAndBarWidth(ideo, config);
  } else {
    ideo.config.annotTracksHeight = 0;
  }

  if (typeof config.annotationsColor === 'undefined') {
    ideo.config.annotationsColor = '#F00';
  }

  initTooltip(ideo, config);
}

function validateAnnotsUrl(annotsUrl) {
  var tmp, extension;

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
  return extension;
}

function afterRawAnnots() {
  var ideo = this,
    config = ideo.config;
  // Ensure annots are ordered by chromosome
  ideo.rawAnnots.annots = ideo.rawAnnots.annots.sort(function(a, b) {
    return naturalSort(a.chr, b.chr);
  });

  if (ideo.onLoadAnnotsCallback) {
    ideo.onLoadAnnotsCallback();
  }

  if (
    'heatmapThresholds' in config ||
    'metadata' in ideo.rawAnnots &&
    'heatmapThresholds' in ideo.rawAnnots.metadata
  ) {
    if (config.annotationsLayout === 'heatmap') {
      inflateHeatmaps(ideo);
    } else if (config.annotationsLayout === 'heatmap-2d') {
      ideo.config.heatmapThresholds = inflateThresholds(ideo);
    }
  }

  if (config.heatmaps) {
    ideo.deserializeAnnotsForHeatmap(ideo.rawAnnots);
  }
}

/**
 * Requests annotations URL via HTTP, sets ideo.rawAnnots for downstream
 * processing.
 *
 * @param annotsUrl Absolute or relative URL for native or BED annotations file
 */
function fetchAnnots(annotsUrl) {
  var extension, is2dHeatmap,
    ideo = this;

  is2dHeatmap = ideo.config.annotationsLayout === 'heatmap-2d';

  if (annotsUrl.slice(0, 4) !== 'http' && !is2dHeatmap) {
    d3.json(ideo.config.annotationsPath)
      .then(function(data) {
        ideo.rawAnnotsResponse = data;
        ideo.rawAnnots = data;
        ideo.afterRawAnnots();
      });
    return;
  }

  extension = (is2dHeatmap ? '' : validateAnnotsUrl(annotsUrl));

  d3.text(annotsUrl).then(function(text) {
    ideo.rawAnnotsResponse = text;
    if (is2dHeatmap) {
      var parser = new ExpressionMatrixParser(text, ideo);
      parser.setRawAnnots().then(function(d) {
        ideo.rawAnnots = d;
        ideo.afterRawAnnots();
      });
    } else {
      if (extension === 'bed') {
        ideo.rawAnnots = new BedParser(text, ideo).rawAnnots;
      } else {
        ideo.rawAnnots = JSON.parse(text);
      }
      ideo.afterRawAnnots();
    }
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
  showAnnotTooltip, onWillShowAnnotTooltip, setOriginalTrackIndexes,
  afterRawAnnots
}
