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

  return labels;
}

function renderTrackLabels(labels, ideo) {
  var labels, i, x, y, annotLabelHeight, labelContainer;

  x = 
    d3.selectAll(ideo.config.container + ' .chromosome-set-container')
      .nodes()[0].getBoundingClientRect().x - 10;

  if (x < 0) {
    x = 12; // Same as chrLeft at 0 in heatmap-collinear.js.  For tabs.
  }

  labelContainer =
    d3.select(ideo.config.container + ' #_ideogramTrackLabelContainer');
  labelContainer.html('');

  annotLabelHeight = 12;
  y = ideo.config.annotationHeight + annotLabelHeight + 4;

  for (i = 0; i < labels.length; i++) {
    labelContainer
      .style('position', 'absolute')
      .append('div')
      .attr('class', '_ideogramTrackLabel')
      .style('opacity', 1)
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('padding', '1px')
      .style('font', '11px sans-serif')
      .style('background', 'white')
      .style('line-height', '10px')
      .style('z-index', '9000')
      .style('left', x + 'px')
      .style('top', (y*i + 2) + 'px')
      .style('width', 'max-content')
      .style('transform-origin', 'bottom left')
      .style('text-align', 'left')
      .html(labels[i])
  }

}

/**
 * Show the label for this track
 */
function writeTrackLabels(ideo) {
    var labels = getLabels(ideo);
    renderTrackLabels(labels, ideo);
}

export {writeTrackLabels}