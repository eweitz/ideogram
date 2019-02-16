/**
 * @fileoverview Functions for heatmaps of genome annotations.
 * Heatmaps provide an easy way to visualize very dense annotation data.
 * Unlike the rest of Ideogram's graphics, which use SVG, heatmaps are
 * rendered using the Canvas element.
 */

import {d3} from '../lib';
import {getHeatmapAnnotColor} from './heatmap-lib';

import {
  startHideTrackLabelTimeout, writeTrackLabelContainer, showTrackLabel
} from './track-labels';

/**
 * Add one canvas that will contain all annotations.  One canvas per chromosome.
 */
function writeCanvas(chr, chrTop, ideoHeight, ideo) {
  var left, trackWidth, canvas, context, id;

  var marginHack = 7; // TODO: Make this dynamic

  // Create a canvas for each annotation track on this chromosome

  trackWidth = ideo.config.annotationHeight * ideogram.rawAnnots.keys.length - 3;
  id = chr.id + '-canvas'; // e.g. chr1-9606-canvas
  // trackTop = chrTop - trackWidth - marginHack;
  left = (ideo.config.chrWidth * 2) + ideo.config.annotationHeight - 0.5;
  canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
    .append('canvas')
    .attr('id', id)
    .attr('width', trackWidth)
    .attr('height', ideoHeight)
    .style('position', 'absolute')
    .style('left', left + 'px')
    .style('top', '0px');
  context = canvas.nodes()[0].getContext('2d');

  return context;
}

/**
 * Render annotations on the canvas.
 *
 * These annotations are 2D; each annotation has many values, each on a track.
 */
function fillCanvasAnnotValues(annot, context, chrWidth, ideo) {
  var i, annot, context, x, values,
    annotHeight = ideo.config.annotationHeight,
    ideoMarginTop = ideo._layout.margin.top;

  values = annot.values;

  // Fill canvas with annotation colors to draw the heatmap
  for (i = 0; i < values.length; i++) {
    context.fillStyle = values[i];
    x = (i - 1) * annotHeight;
    context.fillRect(x, annot.startPx + ideoMarginTop, chrWidth, annotHeight);
  }
}

/**
 * Draw a 2D heatmap of annotations along one chromosome.
 *
 * TODO:
 * - Support in 'horizontal' orientation
 * - Support after rotating chromosome on click
 */
function drawHeatmaps2d(annotContainers, ideo) {
  var annot, chrTop, context, chrWidth, i, chr,
    container = ideo.config.container,
    ideoMarginTop = ideo._layout.margin.top,
    ideoHeight = ideo.config.chrHeight + ideoMarginTop,
    width = ideo.config.annotationHeight * ideogram.rawAnnots.keys.length - 3;

  d3.selectAll(container + ' canvas').remove();

  d3.select(container + ' #_ideogramInnerWrap').style('max-width', width + 'px');
  d3.select(container + ' #_ideogram').attr('width', width);

  chr = ideo.chromosomesArray[0];
  chrWidth = ideo.config.chrWidth;
  chrTop = ideo._layout.getChromosomeSetYTranslate(i);

  context = writeCanvas(chr, chrTop, ideoHeight, ideo);

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {
    annot = annotContainers[i];
    fillCanvasAnnotValues(annot, context, chrWidth, ideo);
  }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

function add2dAnnotsForChr(annots, omittedAnnots, annotsByChr, chrModel,
  m, keys, ideo) {
  var j, k, annot, ra, stop, stopPx, color,
    thresholds = ideo.config.heatmapThresholds,
    omittedAnnots = [];

  for (j = 0; j < annotsByChr.annots.length; j++) {
    ra = annotsByChr.annots[j];
    annot = {};

    annot.values = []; // one value per track

    for (k = 0; k < 3; k++) {
      annot[keys[k]] = ra[k];
    }

    for (k = 3; k < keys.length; k++) {
      color = getHeatmapAnnotColor(thresholds, ra[k]);
      annot.values.push(color);
    }

    stop = annot.start + annot.length;

    annot.chr = annotsByChr.chr;
    annot.chrIndex = m;
    annot.startPx = ideo.convertBpToPx(chrModel, annot.start);
    stopPx = ideo.convertBpToPx(chrModel, stop);
    annot.px = Math.round((annot.startPx + stopPx) / 2);

    annots.push(annot);
  }

  annots.shift();

  return [annots, omittedAnnots];
}

export {drawHeatmaps2d, add2dAnnotsForChr}