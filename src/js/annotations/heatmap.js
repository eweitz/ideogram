import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

/**
 * Starts a timer that, upon expiring, hides the track label.
 *
 * To enable users to copy label content to their clipboard, a timer is
 * used to control when the label disappears.  It starts when the user's
 * cursor leaves the track or the label.  If the user moves the cursor
 * back over the annot or label after the timer starts and before it expires,
 * then the timer is cleared.
 */
function startHideTrackLabelTimeout(ideo) {

  if (ideo.config.showTrackLabel === false) return;

  ideo.hideTrackLabelTimeout = window.setTimeout(function () {
    d3.select('#_ideogramTrackLabel').transition()
      .duration(500)
      .style('opacity', 0)
  }, 250);
}

/**
 * Write label div setup with default styling.
 */
function writeTrackLabelContainer(ideo) {
  d3.select(ideo.config.container + ' #_ideogramOuterWrap').append('div')
    .attr('id', '_ideogramTrackLabel')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('text-align', 'center')
    .style('padding', '1px')
    .style('font', '12px sans-serif')
    .style('background', 'white')
    .style('line-height', '10px')
}

function showTrackLabel(trackCanvas, ideo) {
    var annotKeys, reservedWords, labels, trackIndex, trackBox,
      ideoBox, labelBox;

    clearTimeout(ideo.hideTrackLabelTimeout);

    trackIndex = parseInt(trackCanvas.id.split('-').slice(-1)[0]);
    annotKeys = ideo.rawAnnots.keys.slice(0);
    reservedWords = [
      'name', 'start', 'length', 'trackIndex', 'trackIndexOriginal', 'color'
    ];
    annotKeys = annotKeys.filter(d => !reservedWords.includes(d));
    labels = annotKeys.join('<br>');
    // labels = 'foo<br/>bar';

    trackBox = trackCanvas.getBoundingClientRect();
    ideoBox = d3.select(ideogram.config.container).nodes()[0].getBoundingClientRect();

    d3.select('#_ideogramTrackLabel')
      .interrupt() // Stop any in-progress disapperance
      .style('top', '')
      .style('left', '')
      .style('transform', null)
      .html(labels);

    labelBox = d3.select('#_ideogramTrackLabel').nodes()[0]
      .getBoundingClientRect();

    d3.select('#_ideogramTrackLabel')
      .style('opacity', 1) // Make label visible
      .style('top', ideoBox.top - labelBox.height)
      .style('left', trackBox.left - trackBox.width * (trackIndex + 4))
      .style('text-align', 'left')
      .style('transform', 'rotate(-90deg)')
      .on('mouseover', function () {
        clearTimeout(ideo.hideTrackLabelTimeout);
      })
      .on('mouseout', function () {
        startHideTrackLabelTimeout(ideo);
      });
  }

function writeCanvases(chr, chrLeft, chrWidth, ideoHeight, ideo) {
  var j, trackLeft, trackWidth, canvas, context, id,
    contextArray = [],
    numAnnotTracks = ideo.config.numAnnotTracks;

  var marginHack = 7; // TODO: Make this dynamic

  // Create a canvas for each annotation track on this chromosome
  for (j = 0; j < numAnnotTracks; j++) {
    trackWidth = chrWidth - 1;
    id = chr.id + '-canvas-' + j;
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
  var annots, chrLeft, contextArray, chrWidth, i, chr,
    ideo = this,
    ideoMarginTop = ideo._layout.margin.top,
    ideoHeight = ideo.config.chrHeight + ideoMarginTop;

  d3.selectAll(ideo.config.container + ' canvas').remove();

  writeTrackLabelContainer(ideo);

  // Each "annotationContainer" represents annotations for a chromosome
  for (i = 0; i < annotContainers.length; i++) {

    annots = annotContainers[i].annots;
    chr = ideo.chromosomesArray[i];
    chrWidth = ideo.config.chrWidth;
    chrLeft = ideo._layout.getChromosomeSetYTranslate(i);

    contextArray = writeCanvases(chr, chrLeft, chrWidth, ideoHeight, ideo);
    fillCanvasAnnots(annots, contextArray, chrWidth, ideoMarginTop);
  }

  d3.selectAll(ideo.config.container + ' canvas')
    .on('mouseover', function() { showTrackLabel(this, ideo); })
    .on('mouseout', function() { startHideTrackLabelTimeout(ideo); });

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

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

export {drawHeatmaps, deserializeAnnotsForHeatmap}