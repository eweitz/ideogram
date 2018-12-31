/**
 * @fileoverview Functions for collinear heatmaps of genome annotations.
 * See heatmap.js for more.
 */

import * as d3selection from 'd3-selection';
import * as d3multiselection from 'd3-selection-multi';

import {writeTrackLabels} from './track-labels-collinear';

var d3 = Object.assign({}, d3selection, d3multiselection);

/**
 * Add canvases that will contain annotations.  One canvas per track.
 */
function writeCanvases(chr, chrLeft, ideo) {
  var j, trackLeft, trackWidth, canvas, context, id,
    contextArray = [],
    numAnnotTracks = ideo.config.numAnnotTracks;

  var annotLabelHeight = 12;

  // Create a canvas for each annotation track on this chromosome
  for (j = 0; j < numAnnotTracks; j++) {
    trackWidth = ideo.config.annotationHeight + annotLabelHeight + 4;
    id = chr.id + '-canvas-' + j; // e.g. chr1-9606-canvas-0
    trackLeft = chrLeft
    canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
      .append('canvas')
      .attrs({
        id: id,
        width: Math.round(chr.width) + 1,
        height: trackWidth
      })
      .styles({
        position: 'absolute',
        left: Math.round(trackLeft) + 'px',
        top: (trackWidth*j + 1) + 'px'
      });
    context = canvas.nodes()[0].getContext('2d');
    contextArray.push(context);
  }

  return contextArray;
}

/**
 * Render annotations on the canvas
 */
function fillCanvasAnnots(annots, contextArray, ideo) {
  var j, annot, context;

  var annotLabelHeight = 12;

  // Fill in the canvas(es) with annotation colors to draw a heatmap
  for (j = 0; j < annots.length; j++) {
    annot = annots[j];
    context = contextArray[annot.trackIndex]; 
    context.fillStyle = annot.color;
    context.fillRect(
      annot.startPx, 1 + annotLabelHeight,
      0.5, ideo.config.annotationHeight
    );
  }
}

/**
 * Draw a 1D heatmap of annotations along each chromosome.
 * Ideal for representing very dense annotation sets in a granular manner
 * without subsampling.
 *
 * TODO:
 * - Support in 'vertical' orientation
 * - Support after rotating chromosome on click
 */
function drawHeatmapsCollinear(annotContainers, ideo) {
  var annots, chrLeft, contextArray, i, chr,
    prevX = 0,
    xBump = (ideo.config.showChromosomesLabels) ? 2 : -0.1;

  d3.select(ideo.selector).classed('labeledLeft', false);
  d3.selectAll(ideo.config.container + ' canvas').remove();

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {
    annots = annotContainers[i].annots;
    chr = ideo.chromosomesArray[i];
    if (i === 0) {
      chrLeft = 12;
    } else {
      chrLeft = prevX + ideo.chromosomesArray[i - 1].width + 14;
      prevX += ideo.chromosomesArray[i - 1].width + xBump;
    }
    contextArray = writeCanvases(chr, chrLeft, ideo);
    fillCanvasAnnots(annots, contextArray, ideo);
  }

  writeTrackLabels(ideo);

  if (ideo.onDrawAnnotsCallback) ideo.onDrawAnnotsCallback();
}


export {drawHeatmapsCollinear}