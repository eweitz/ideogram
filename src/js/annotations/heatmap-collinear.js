/**
 * @fileoverview Functions for collinear heatmaps of genome annotations.
 * See heatmap.js for more.
 */

import {d3} from '../lib';
import {writeTrackLabels} from './track-labels-collinear';

function inflateHeatmaps(ideo) {
  var i, labels, heatmaps, annotationTracks, rawAnnots, displayedTracks;

  heatmaps = [];
  rawAnnots = ideo.rawAnnots;
  labels = rawAnnots.keys.slice(3,);

  annotationTracks = [];
  displayedTracks = []

  for (i = 0; i < labels.length; i++) {
    heatmaps.push({key: labels[i], thresholds: ideo.config.heatmapThresholds});
    annotationTracks.push({id: labels[i]});
    displayedTracks.push(i + 1)
  }

  ideo.config.annotationsNumTracks = labels.length;
  ideo.config.annotationsDisplayedTracks = displayedTracks;
  ideo.config.heatmaps = heatmaps;
  ideo.config.annotationTracks = annotationTracks;
}

/**
 * Add canvases that will contain annotations.  One canvas per track.
 */
function writeCanvases(chr, chrLeft, ideo) {
  var j, trackLeft, trackWidth, canvas, context, id,
    chrWidth = chr.width,
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
      .attr('id', id)
      .attr('width', chrWidth + 1)
      .attr('height', trackWidth)
      .style('position', 'absolute')
      .style('left', trackLeft + 'px')
      .style('top', (trackWidth*j + 1) + 'px');
    context = canvas.nodes()[0].getContext('2d');
    contextArray.push([context, chr]);
  }

  return contextArray;
}

/**
 * Render annotations on the canvas
 */
function fillCanvasAnnots(annots, contextArray, ideo) {
  var j, annot, context, chr, thisTopNotch,
    demarcateChrs = ideogram.config.demarcateCollinearChromosomes,
    topNotch = 20,
    bottomNotch = topNotch * 2;

  var annotLabelHeight = 12;
  var trackWidth = ideo.config.annotationHeight + annotLabelHeight + 4;

  // Fill in the canvas(es) with annotation colors to draw a heatmap
  for (j = 0; j < annots.length; j++) {
    annot = annots[j];
    context = contextArray[annot.trackIndex][0];
    chr = contextArray[annot.trackIndex][1];
    context.fillStyle = annot.color;
    if (demarcateChrs) {
      if (1 > annot.startPx || annot.startPx > chr.width - 1) continue;
      context.fillRect(
        annot.startPx, 1,
        0.5, trackWidth
      );
    } else {
      context.fillRect(
        annot.startPx, 1 + annotLabelHeight,
        0.5, ideo.config.annotationHeight
      );
    }
  }

  if (demarcateChrs) {
    for (j = 0; j < contextArray.length; j++) {
      context = contextArray[j][0];
      chr = contextArray[j][1];
      thisTopNotch = (j === 0 ? 0 : topNotch);
      context.fillStyle = '#555';
      context.fillRect(
        chr.width - 1, 0,
        1, ideo.config.annotationHeight + bottomNotch
      );
      context.fillRect(0, 0, chr.width - 1, 1);
    }
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


export {drawHeatmapsCollinear, inflateHeatmaps}