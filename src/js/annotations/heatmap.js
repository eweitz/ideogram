import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

/**
 * Draws a 1D heatmap of annotations along each chromosome.
 * Ideal for representing very dense annotation sets in a granular manner
 * without subsampling.
 *
 * TODO:
 * - Support in 'horizontal' orientation
 * - Support after rotating chromosome on click
 *
 * @param annots {Array} Processed annotation objects
 */
function drawHeatmaps(annotContainers) {

  var ideo = this,
    ideoRect = d3.select(ideo.selector).nodes()[0].getBoundingClientRect(),
    i, j;

  d3.selectAll(ideo.config.container + ' canvas').remove();

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {

    var annots, chr, chrRect, heatmapLeft, canvas, contextArray,
      chrWidth, context, annot, x, annotHeight;

    annots = annotContainers[i].annots;
    chr = ideo.chromosomesArray[i];
    chrRect = d3.select('#' + chr.id).nodes()[0].getBoundingClientRect();
    chrWidth = ideo.config.chrWidth;

    contextArray = [];

    heatmapLeft = chrRect.x - chrWidth*1.8;

    annotHeight = ideo.config.annotationHeight;

    // Create a canvas for each annotation track on this chromosome
    for (j = 0; j < ideo.config.numAnnotTracks; j++) {
      canvas = d3.select(ideo.config.container + ' > div')
        .append('canvas')
        .attr('id', chr.id + '-canvas-' + j)
        .attr('width', chrWidth - 1)
        .attr('height', ideoRect.height)
        .style('position', 'absolute')
        .style('left', heatmapLeft - chrWidth*j);
      context = canvas.nodes()[0].getContext('2d');
      contextArray.push(context);
    }

    // Fill in the canvas(es) with annotation colors to draw a heatmap
    for (j = 0; j < annots.length; j++) {
      annot = annots[j];
      context = contextArray[annot.trackIndex];
      context.fillStyle = annot.color;
      x = annot.trackIndex - 1;
      context.fillRect(x, annot.startPx + 30, chrWidth, 0.5);
    }
  }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

/**
 * Deserializes compressed annotation data into a format suited for heatmaps.
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

  var t0 = new Date().getTime();

  var raContainer, chr, ra, i, j, k, m, trackIndex, rawAnnots,
    newRaContainers, newRa, newRas, color,
    heatmapKey, heatmapKeyIndexes, value,
    thresholds, thresholdList, thresholdColor, threshold, prevThreshold,
    tvInt, numThresholds,
    keys = rawAnnotsContainer.keys,
    rawAnnotBoxes = rawAnnotsContainer.annots,
    ideo = this;

  newRaContainers = [];

  heatmapKeyIndexes = [];
  for (i = 0; i < ideo.config.heatmaps.length; i++) {
    heatmapKey = ideo.config.heatmaps[i].key;
    heatmapKeyIndexes.push(keys.indexOf(heatmapKey));
  }

  for (i = 0; i < rawAnnotBoxes.length; i++) {

    raContainer = rawAnnotBoxes[i];
    chr = raContainer.chr;
    rawAnnots = raContainer.annots;
    newRas = [];

    for (j = 0; j < rawAnnots.length; j++) {

      ra = rawAnnots[j];

      for (k = 0; k < heatmapKeyIndexes.length; k++) {

        newRa = ra.slice(0, 3); // name, start, length

        value = ra[heatmapKeyIndexes[k]];
        thresholds = ideo.config.heatmaps[k].thresholds;

        for (m = 0; m < thresholds.length; m++) {
          numThresholds = thresholds.length - 1;
          thresholdList = thresholds[m];
          threshold = thresholdList[0];

          // The threshold value is usually an integer,
          // but can also be a "+" character indicating that
          // this threshold is anything greater than the previous threshold.
          tvInt = parseInt(threshold);
          if (isNaN(tvInt) === false) {
            threshold = tvInt;
          }
          if (m !== 0) {
            prevThreshold = parseInt(thresholds[m - 1][0]);
          }
          thresholdColor = thresholdList[1];

          if (

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
          ) {
            color = thresholdColor;
          }
        }

        trackIndex = k;
        newRa.push(trackIndex, color, value);
        newRas.push(newRa);
      }
    }
    newRaContainers.push({chr: chr, annots: newRas});
  }

  keys.splice(3, 0, 'trackIndex');
  keys.splice(4, 0, 'color');

  ideo.rawAnnots.keys = keys;
  ideo.rawAnnots.annots = newRaContainers;

  var t1 = new Date().getTime();
  if (ideogram.config.debug) {
    console.log('Time in deserializeAnnotsForHeatmap: ' + (t1 - t0) + ' ms');
  }
}

export {drawHeatmaps, deserializeAnnotsForHeatmap}