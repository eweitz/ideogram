/**
 * @fileoverview Functions for labeling collinear tracks of genome annotations.
 * See track-labels.js for more.
 */

import * as d3selection from 'd3-selection';
import * as d3multiselection from 'd3-selection-multi';

import getLabels from './heatmap-lib';

var d3 = Object.assign({}, d3selection, d3multiselection);

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
      .styles({
        opacity: 1, position: 'absolute', textAlign: 'center', padding: '1px',
        font: '11px sans-serif', background: 'white', lineHeight: '10px',
        zIndex: '9000', width: 'max-content', transformOrigin: 'bottom left',
        textAlign: 'left',
        left: x + 'px',
        top: (y*i + 2) + 'px'
      })
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