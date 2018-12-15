/**
 * @fileoverview Functions for heatmaps of genome annotations.
 * Heatmaps provide an easy way to visualize very dense annotation data.
 * Unlike the rest of Ideogram's graphics, which use SVG, heatmaps are
 * rendered using the Canvas element.
 */

import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

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
    trackWidth = ideo.config.annotationHeight;
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

  // Fill in the canvas(es) with annotation colors to draw a heatmap
  for (j = 0; j < annots.length; j++) {
    annot = annots[j];
    context = contextArray[annot.trackIndex];
    context.fillStyle = annot.color;
    context.fillRect(annot.startPx, 1, 0.5, ideo.config.annotationHeight);
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

  writeTrackLabelContainer(ideo);

  prevX = 0;
  xBump = (ideo.config.showChromosomesLabels) ? 2 : 0.7;

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

  d3.selectAll(ideo.config.container + ' canvas')
    .on('mouseover', function() { showTrackLabel(this, ideo); })
    .on('mouseout', function() { startHideTrackLabelTimeout(ideo); });

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

/**
 * Given annotation value (m), should it use the color in this threshold?
 */
function shouldUseThresholdColor(m, numThresholds, value, prevThreshold,
  threshold) {

  return (
    // If this is the last threshold, and
    // its value is "+" and the value is above the previous threshold...
    m === numThresholds && (
      threshold === '+' && value > prevThreshold
    ) ||

    // ... or if the value matches the threshold...
    value === threshold ||

    // ... or if this isn't the first or last threshold, and
    // the value is between this threshold and the previous one...
    m !== 0 && m !== numThresholds && (
      value <= threshold &&
      value > prevThreshold
    ) ||

    // ... or if this is the first threshold and the value is
    // at or below the threshold
    m === 0 && value <= threshold
  );
}

/**
 * Determine the color of the heatmap annotation.
 */
function getHeatmapAnnotColor(thresholds, value) {
  var m, numThresholds, thresholdList, threshold, tvInt, thresholdColor,
    prevThreshold, useThresholdColor, color;

  for (m = 0; m < thresholds.length; m++) {
    numThresholds = thresholds.length - 1;
    thresholdList = thresholds[m];
    threshold = thresholdList[0];

    // The threshold value is usually an integer,
    // but can also be a "+" character indicating that
    // this threshold is anything greater than the previous threshold.
    tvInt = parseInt(threshold);
    if (isNaN(tvInt) === false) threshold = tvInt;
    if (m !== 0) prevThreshold = parseInt(thresholds[m - 1][0]);
    thresholdColor = thresholdList[1];

    useThresholdColor = shouldUseThresholdColor(m, numThresholds, value,
      prevThreshold, threshold);

    if (useThresholdColor) color = thresholdColor;
  }

  return color;
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

function reportPerformance(t0, ideo) {
  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in deserializeAnnotsForHeatmapCollinear: ' + (t1 - t0) + ' ms');
  }
}

export {drawHeatmapsCollinear}