/**
 * @fileoverview Functions for labeling collinear tracks of genome annotations.
 * See track-labels.js for more.
 */

import * as d3selection from 'd3-selection';

import getLabels from './heatmap-lib';

var d3 = Object.assign({}, d3selection);

function renderTrackLabels(labels, ideo) {
  var labels, i, x, y, annotLabelHeight, labelContainer;

  x = 11; // Close to chrLeft in heatmap-collinear.js.  For tabs.

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