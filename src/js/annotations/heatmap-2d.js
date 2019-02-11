/**
 * @fileoverview Functions for heatmaps of genome annotations.
 * Heatmaps provide an easy way to visualize very dense annotation data.
 * Unlike the rest of Ideogram's graphics, which use SVG, heatmaps are
 * rendered using the Canvas element.
 */

import {d3} from '../lib';

import {
  startHideTrackLabelTimeout, writeTrackLabelContainer, showTrackLabel
} from './track-labels';

/**
 * Add canvases that will contain annotations.  One canvas per track.
 */
function writeCanvases(chr, chrTop, ideoHeight, ideo) {
  var j, trackTop, trackWidth, canvas, context, id,
    contextArray = [],
    numAnnotTracks = ideo.config.numAnnotTracks;

  var marginHack = 7; // TODO: Make this dynamic

  // Create a canvas for each annotation track on this chromosome
  for (j = 0; j < numAnnotTracks; j++) {
    trackWidth = ideo.config.annotationHeight * ideogram.rawAnnots.keys.length - 3;
    id = chr.id + '-canvas-' + j; // e.g. chr1-9606-canvas-0
    trackTop = chrTop - trackWidth * (numAnnotTracks - j) - marginHack;
    canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
      .append('canvas')
      .attr('id', id)
      .attr('width', trackWidth)
      .attr('height', ideoHeight)
      .style('position', 'absolute')
      .style('left', trackTop + 'px');
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
 * Draw a 2D heatmap of annotations along one chromosome.
 *
 * TODO:
 * - Support in 'horizontal' orientation
 * - Support after rotating chromosome on click
 */
function drawHeatmaps2d(annotContainers, ideo) {
  var annots, chrTop, contextArray, chrWidth, i, chr,
    ideoMarginTop = ideo._layout.margin.top,
    ideoHeight = ideo.config.chrHeight + ideoMarginTop;

  d3.selectAll(ideo.config.container + ' canvas').remove();

  // writeTrackLabelContainer(ideo);

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {

    annots = annotContainers[i].annots;
    chr = ideo.chromosomesArray[i];
    chrWidth = ideo.config.chrWidth;
    chrTop = ideo._layout.getChromosomeSetYTranslate(i);

    contextArray = writeCanvases(chr, chrTop, ideoHeight, ideo);
    fillCanvasAnnots(annots, contextArray, chrWidth, ideoMarginTop);
  }

  d3.selectAll(ideo.config.container + ' canvas')
    .on('mouseover', function() { showTrackLabel(this, ideo); })
    .on('mouseout', function() { startHideTrackLabelTimeout(ideo); });

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

export {drawHeatmaps2d}