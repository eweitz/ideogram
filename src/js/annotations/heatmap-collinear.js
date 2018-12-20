/**
 * @fileoverview Functions for heatmaps of genome annotations.
 * Heatmaps provide an easy way to visualize very dense annotation data.
 * Unlike the rest of Ideogram's graphics, which use SVG, heatmaps are
 * rendered using the Canvas element.
 */

import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

import {writeTrackLabels} from './track-labels-collinear';

/**
 * Add canvases that will contain annotations.  One canvas per track.
 */
function writeCanvases(chr, chrLeft, ideoHeight, ideo) {
  var j, trackLeft, trackWidth, canvas, context, id,
    contextArray = [],
    numAnnotTracks = ideo.config.numAnnotTracks;

  var annotLabelHeight = 12;

  // Create a canvas for each annotation track on this chromosome
  for (j = 0; j < numAnnotTracks; j++) {
    // trackWidth = ideo.config.annotationHeight;
    // id = chr.id + '-canvas-' + j; // e.g. chr1-9606-canvas-0
    // trackLeft = chrLeft - trackWidth * (numAnnotTracks - j) - marginHack;
    // canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
    //   .append('canvas')
    //   .attr('id', id)
    //   .attr('width', trackWidth)
    //   .attr('height', ideoHeight)
    //   .style('position', 'absolute')
    //   .style('left', trackLeft + 'px');
    // context = canvas.nodes()[0].getContext('2d');
    // contextArray.push(context);
    trackWidth = ideo.config.annotationHeight + annotLabelHeight;
    id = chr.id + '-canvas-' + j; // e.g. chr1-9606-canvas-0
    // trackLeft = chrLeft - trackWidth * (numAnnotTracks - j) - marginHack;
    trackLeft = chrLeft
    canvas = d3.select(ideo.config.container + ' #_ideogramInnerWrap')
      .append('canvas')
      .attr('id', id)
      .attr('width', Math.round(chr.width) + 2)
      .attr('height', trackWidth)
      .style('position', 'absolute')
      .style('left', Math.round(trackLeft) + 'px')
      .style('top', (trackWidth*j) + 'px')
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
 * - Support in 'horizontal' orientation
 * - Support after rotating chromosome on click
 */
function drawHeatmapsCollinear(annotContainers, ideo) {
  var annots, chrLeft, contextArray, chrHeight, i, chr, prevX, xBump,
    ideoMarginTop = ideo._layout.margin.top,
    ideoHeight = ideo.config.chrHeight + ideoMarginTop;


  d3.select(ideo.selector).classed('labeledLeft', false);

  d3.selectAll(ideo.config.container + ' canvas').remove();

  prevX = 0;
  xBump = (ideo.config.showChromosomesLabels) ? 2 : -0.1;

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {

    annots = annotContainers[i].annots;
    chr = ideo.chromosomesArray[i];
    chrHeight = ideo.config.chrHeight;
    if (i === 0) {
      chrLeft = 12;
    } else {
      chrLeft = prevX + ideo.chromosomesArray[i - 1].width + 14;
      prevX += ideo.chromosomesArray[i - 1].width + xBump;
    }

    contextArray = writeCanvases(chr, chrLeft, ideoHeight, ideo);
    fillCanvasAnnots(annots, contextArray, ideo);
  }

  writeTrackLabels(ideo);

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}


export {drawHeatmapsCollinear}