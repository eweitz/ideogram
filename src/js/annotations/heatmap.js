/**
 * @fileoverview Functions for 2D heatmaps of genome annotations.
 * Heatmaps provide an easy way to visualize very dense annotation data.
 * Unlike the rest of Ideogram's graphics, which use SVG, heatmaps are
 * rendered using the Canvas element.
 */

import {d3} from '../lib';
import {drawHeatmapsCollinear} from './heatmap-collinear';
import {drawHeatmaps2d} from './heatmap-2d';
import {getHeatmapAnnotColor} from './heatmap-lib';

import {
  startHideTrackLabelTimeout, writeTrackLabelContainer, showTrackLabel
} from './track-labels';

/**
 * Add canvases that will contain annotations.  One canvas per track.
 */
function writeCanvases(chr, chrLeft, ideoHeight, ideo) {
  var j, trackLeft, trackWidth, canvas, context, id,
    contextArray = [],
    numAnnotTracks = ideo.config.numAnnotTracks;

  var marginHack = 7; // TODO: Make this dynamic

  // Create a canvas for each annotation track on this chromosome
  for (j = 0; j < numAnnotTracks; j++) {
    trackWidth = ideo.config.annotationHeight;
    id = chr.id + '-canvas-' + j; // e.g. chr1-9606-canvas-0
    trackLeft = chrLeft - trackWidth * (numAnnotTracks - j) - marginHack;
    canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
      .append('canvas')
      .attr('id', id)
      .attr('width', trackWidth)
      .attr('height', ideoHeight)
      .style('position', 'absolute')
      .style('left', trackLeft + 'px');
    context = canvas.nodes()[0].getContext('2d');
    contextArray.push(context);
  }

  return contextArray;
}

/**
 * Render annotations on the canvas
 */
function fillCanvasAnnots(annots, contextArray, chrWidth, ideoMarginTop) {
  var j, annot, context, x;

  // Fill in the canvas(es) with annotation colors to draw a heatmap
  for (j = 0; j < annots.length; j++) {
    annot = annots[j];
    context = contextArray[annot.trackIndex];
    context.fillStyle = annot.color;
    x = annot.trackIndex - 1;
    context.fillRect(x, annot.startPx + ideoMarginTop, chrWidth, 0.5);
  }
}

/**
 * Draw a 1D heatmap of annotations along each chromosome.
 * Ideal for representing very dense annotation sets in a granular manner
 * without subsampling.
 *
 * TODO:
 * - Support in 'horizontal' orientation
 * - Support after rotating chromosome on click
 */
function drawHeatmaps(annotContainers) {
  var annots, chrLeft, contextArray, chrWidth, i, chr,
    ideo = this,
    config = ideo.config,
    ideoMarginTop = ideo._layout.margin.top,
    ideoHeight = config.chrHeight + ideoMarginTop;

  if (config.geometry === 'collinear') {
    return drawHeatmapsCollinear(annotContainers, ideo);
  } else if (config.annotationsLayout === 'heatmap-2d') {
    return drawHeatmaps2d(annotContainers, ideo);
  }

  d3.selectAll(ideo.config.container + ' canvas').remove();

  writeTrackLabelContainer(ideo);

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {

    annots = annotContainers[i].annots;
    chr = ideo.chromosomesArray[i];
    chrWidth = ideo.config.chrWidth;
    chrLeft = ideo._layout.getChromosomeSetYTranslate(i);

    contextArray = writeCanvases(chr, chrLeft, ideoHeight, ideo);
    fillCanvasAnnots(annots, contextArray, chrWidth, ideoMarginTop);
  }

  d3.selectAll(ideo.config.container + ' canvas')
    .on('mouseover', function() { showTrackLabel(this, ideo); })
    .on('mouseout', function() { startHideTrackLabelTimeout(ideo); });

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

/**
 * Set color and track index for raw annotation objects.
 */
function getNewRawAnnots(heatmapKeyIndexes, rawAnnots, ideo) {
  var j, k, ra, newRa, value, thresholds, color, trackIndex,
    newRas = [];

  for (j = 0; j < rawAnnots.length; j++) {
    ra = rawAnnots[j];
    for (k = 0; k < heatmapKeyIndexes.length; k++) {
      newRa = ra.slice(0, 3); // name, start, length

      value = ra[heatmapKeyIndexes[k]];
      thresholds = ideo.config.heatmaps[k].thresholds;
      color = getHeatmapAnnotColor(thresholds, value);

      trackIndex = k;
      newRa.push(trackIndex, color, value);
      newRas.push(newRa);
    }
  }

  return newRas;
}

function getNewRawAnnotContainers(heatmapKeyIndexes, rawAnnotBoxes, ideo) {
  var raContainer, chr, rawAnnots, newRas, i,
    newRaContainers = [];

  for (i = 0; i < rawAnnotBoxes.length; i++) {
    raContainer = rawAnnotBoxes[i];
    chr = raContainer.chr;

    rawAnnots = raContainer.annots;
    newRas = getNewRawAnnots(heatmapKeyIndexes, rawAnnots, ideo);

    newRaContainers.push({chr: chr, annots: newRas});
  }
  return newRaContainers;
}

function reportPerformance(t0, ideo) {
  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in deserializeAnnotsForHeatmap: ' + (t1 - t0) + ' ms');
  }
}

/**
 * Deserialize compressed annotation data into a format suited for heatmaps.
 *
 * This enables the annotations to be downloaded from a server without the
 * requested annotations JSON needing to explicitly specify track index or
 * color.  The track index and color are inferred from the "heatmaps" Ideogram
 * configuration option defined before ideogram initialization.
 *
 * This saves time for the user.
 *
 * @param rawAnnotsContainer {Object} Raw annotations as passed from server
 */
function deserializeAnnotsForHeatmap(rawAnnotsContainer) {
  var newRaContainers, heatmapKey, heatmapKeyIndexes, i,
    t0 = new Date().getTime(),
    keys = rawAnnotsContainer.keys,
    rawAnnotBoxes = rawAnnotsContainer.annots,
    ideo = this;

  heatmapKeyIndexes = [];
  for (i = 0; i < ideo.config.heatmaps.length; i++) {
    heatmapKey = ideo.config.heatmaps[i].key;
    heatmapKeyIndexes.push(keys.indexOf(heatmapKey));
  }

  newRaContainers =
    getNewRawAnnotContainers(heatmapKeyIndexes, rawAnnotBoxes, ideo);

  keys.splice(3, 0, 'trackIndex');
  keys.splice(4, 0, 'color');

  ideo.rawAnnots.keys = keys;
  ideo.rawAnnots.annots = newRaContainers;

  reportPerformance(t0, ideo);
}

export {drawHeatmaps, deserializeAnnotsForHeatmap};
