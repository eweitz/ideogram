/**
 * @fileoverview Functions for labeling tracks of genome annotations.
 * Tracks are columns of annotations that run beside a chromosome.
 * Labeling tracks with descriptive names makes them easier to understand.
 */

import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

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
    d3.select('#_ideogramTrackLabel').transition()
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

function getLabels(ideo) {
  var annotKeys, reservedWords, labels, heatmaps, i;

  if (ideo.rawAnnots.metadata) {
    labels = ideo.rawAnnots.metadata.trackLabels;
    if (ideo.displayedTrackIndexes) {
      labels = labels.filter(function(d, i) {
        return ideo.displayedTrackIndexes.includes(i + 1);
      });
    }
  } else if (ideo.config.heatmaps) {
    labels = [];
    heatmaps = ideo.config.heatmaps;
    for (i = 0; i < heatmaps.length; i++) {
      labels.push(heatmaps[i].key);
    }
  } else {
    annotKeys = ideo.rawAnnots.keys.slice(0);
    reservedWords = [
      'name', 'start', 'length', 'trackIndex', 'trackIndexOriginal', 'color'
    ];
    labels = annotKeys.filter(d => !reservedWords.includes(d));
  }
  labels = labels.join('<br>')
  // labels = 'foo';
  // labels = 'foo<br>bar<br>baz<br>moo';

  return labels;
}

function showTrackLabel(trackCanvas, ideo) {
    var labels, firstTrackId, firstTrack, trackBox, labelBox, left, ideoBox,
      top,
      marginHack = 7; // TODO: Make this dynamic

    clearTimeout(ideo.hideTrackLabelTimeout);

    labels = getLabels(ideo);

    firstTrackId = trackCanvas.id.split('-').slice(0, -1).join('-') + '-0';
    firstTrack = d3.select('#' + firstTrackId).nodes()[0];
    trackBox = firstTrack.getBoundingClientRect();

    d3.select('#_ideogramTrackLabel')
      .interrupt() // Stop any in-progress disapperance
      .style('top', '')
      .style('left', '')
      .style('transform', null)
      .style('transform', 'rotate(-90deg)')
      .html(labels);

    labelBox = d3.select(ideo.config.container + ' #_ideogramTrackLabel')
      .nodes()[0].getBoundingClientRect();
    ideoBox = d3.select(ideo.config.container).nodes()[0]
      .getBoundingClientRect();

    left = Math.round(trackBox.left + labelBox.width) - trackBox.width - 1;
    left -= ideoBox.left - marginHack;
    top = -(labels.split('<br>').length - 2) * trackBox.width + 2;

    d3.select('#_ideogramTrackLabel')
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

export {
  startHideTrackLabelTimeout, writeTrackLabelContainer, showTrackLabel
}