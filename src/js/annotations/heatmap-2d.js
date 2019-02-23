/**
 * @fileoverview Functions for 2D heatmaps of genome annotations.
 * 2D heatmaps enable showing many (100+) tracks of data in one dimension,
 * for features (e.g. genes) along a dimension of genomic coordinates in
 * chromosome context.
 * 
 * TO DO:
 * - Horizontal orientation
 * - Multiple chromosomes
 * - Non-human organisms
 */

import {d3} from '../lib';
import {getHeatmapAnnotColor} from './heatmap-lib';

/**
 * Add one canvas that will contain all annotations.  One canvas per chromosome.
 */
function writeCanvas(chr, ideoHeight, width, ideo) {
  var left,  canvas, context, id;

  id = chr.id + '-canvas'; // e.g. chr1-9606-canvas
  left = (ideo.config.chrWidth * 2) + ideo.config.annotationHeight - 0.5;
  canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
    .append('canvas')
    .attr('id', id)
    .attr('width', width)
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
function fillCanvasAnnotValues(annot, context, ideo) {
  var i, annot, context, x, values,
    annotHeight = ideo.config.annotationHeight,
    ideoMarginTop = ideo._layout.margin.top;

  values = annot.values;

  // Fill canvas with annotation colors to draw the heatmap
  for (i = 0; i < values.length; i++) {
    context.fillStyle = values[i];
    x = (i - 1) * annotHeight;
    context.fillRect(x, annot.startPx + ideoMarginTop, annotHeight, 2);
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
  var annot, context, i, chr,
    container = ideo.config.container,
    ideoMarginTop = ideo._layout.margin.top,
    ideoHeight = ideo.config.chrHeight + ideoMarginTop,
    width = ideo.config.annotationHeight * annotContainers[0].values.length;

  d3.selectAll(container + ' canvas').remove();

  d3.select(container + ' #_ideogramInnerWrap').style('max-width', width + 'px');
  d3.select(container + ' #_ideogram').attr('width', width);

  chr = ideo.chromosomesArray[0];

  context = writeCanvas(chr, ideoHeight, width, ideo);

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {
    annot = annotContainers[i];
    fillCanvasAnnotValues(annot, context, ideo);
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