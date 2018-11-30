/**
 * @fileoverview Functions for labeling tracks of genome annotations.
 * Tracks are columns of annotations that run beside a chromosome.
 * Labeling tracks with descriptive names makes them easier to understand.
 */

import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

var reservedTrackKeys = [
  'name', 'start', 'length', 'trackIndex', 'trackIndexOriginal', 'color'
];

/**
 * Start a timer that, upon expiring, hides the track label.
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
    d3.select(ideo.config.container + ' #_ideogramTrackLabel').transition()
      .duration(500)
      .style('opacity', 0)
  }, 250);
}

/**
 * Write label div setup with default styling.
 */
function writeTrackLabelContainer(ideo) {
  d3.select(ideo.config.container + ' #_ideogramTrackLabelContainer')
    .append('div')
    .attr('id', '_ideogramTrackLabel')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('text-align', 'center')
    .style('padding', '1px')
    .style('font', '11px sans-serif')
    .style('background', 'white')
    .style('line-height', '10px')
}

/**
 * Get label text for displayed tracks from annotation container metadata,
 * heatmap keys, or annotation container keys
 */
function getLabels(ideo) {
  var annotKeys, labels, heatmaps, i;

  if (ideo.rawAnnots.metadata) {
    labels = ideo.rawAnnots.metadata.trackLabels;
  } else if (ideo.config.heatmaps) {
    labels = [];
    heatmaps = ideo.config.heatmaps;
    for (i = 0; i < heatmaps.length; i++) {
      labels.push(heatmaps[i].key);
    }
  } else {
    annotKeys = ideo.rawAnnots.keys.slice(0);
    labels = annotKeys.filter(d => !reservedTrackKeys.includes(d));
  }

  if (ideo.displayedTrackIndexes) {
    labels = labels.filter(function(d, i) {
      return ideo.displayedTrackIndexes.includes(i + 1);
    });
  }

  labels = labels.join('<br>');

  return labels;
}

/**
 * Display track labels on the page
 */
function renderTrackLabels(top, left, ideo) {
  d3.select(ideo.config.container + ' #_ideogramTrackLabel')
    .style('opacity', 1) // Make label visible
    .style('left', left + 'px')
    .style('top', top + 'px')
    .style('width', 'max-content')
    .style('transform-origin', 'bottom left')
    .style('text-align', 'left')
    .on('mouseover', function () {
      clearTimeout(ideo.hideTrackLabelTimeout);
    })
    .on('mouseout', function () {
      startHideTrackLabelTimeout(ideo);
    });
}

/**
 * Get left and top (x and y) offset for track label text
 */
function getTrackLabelOffsets(labels, trackCanvas, ideo) {
  var labels, firstTrackId, firstTrack, trackBox, labelBox, ideoBox, left, top,
    marginHack = 7; // TODO: Make this dynamic

  firstTrackId = trackCanvas.id.split('-').slice(0, -1).join('-') + '-0';
  firstTrack = d3.select(ideo.config.container + ' #' + firstTrackId)
    .nodes()[0];
  trackBox = firstTrack.getBoundingClientRect();

  labelBox = d3.select(ideo.config.container + ' #_ideogramTrackLabel')
    .nodes()[0].getBoundingClientRect();
  ideoBox = d3.select(ideo.config.container).nodes()[0]
    .getBoundingClientRect();

  left = Math.round(trackBox.left + labelBox.width) - trackBox.width - 1;
  left -= ideoBox.left - marginHack;
  top = -(labels.split('<br>').length - 2) * trackBox.width + 2;

  return [left, top];
}

/**
 * Show the track label for this track
 */
function showTrackLabel(trackCanvas, ideo) {
    var labels, left, top;

    clearTimeout(ideo.hideTrackLabelTimeout);

    labels = getLabels(ideo);

    // Clear any previous positioning, write track label text to DOM
    d3.select(ideo.config.container + ' #_ideogramTrackLabel')
      .interrupt() // Stop any in-progress disapperance
      .style('top', '')
      .style('left', '')
      .style('transform', null)
      .style('transform', 'rotate(-90deg)')
      .html(labels);

    [left, top] = getTrackLabelOffsets(labels, trackCanvas, ideo);

    renderTrackLabels(top, left, ideo);
}

export {
  startHideTrackLabelTimeout, writeTrackLabelContainer, showTrackLabel
}