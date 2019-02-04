/**
 * @fileoverview Functions for labeling collinear tracks of genome annotations.
 * See track-labels.js for more.
 */

import {d3} from '../lib';
import {getLabels} from './heatmap-lib';

function renderTrackLabels(labels, ideo) {
  var labels, i, x, y, labelContainer, markBump,
    annotLabelHeight = ideo.config.annotLabelHeight,
    demarcateChrs = ideo.config.demarcateCollinearChromosomes;

  x = 11; // Close to chrLeft in heatmap-collinear.js.  For tabs.
  markBump = (demarcateChrs ? 2 : 0); // Make labels flush with demarcations

  labelContainer =
    d3.select(ideo.config.container + ' #_ideogramTrackLabelContainer');
  labelContainer.html('');

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
      .style('z-index', '5')
      .style('left', (x + markBump) + 'px')
      .style('top', (y*i + markBump) + 'px')
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