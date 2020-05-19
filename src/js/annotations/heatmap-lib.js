/**
 * @fileoverview Functions used by parallel and collinear heatmaps.
 */

var reservedTrackKeys = [
  'name', 'start', 'length', 'trackIndex', 'trackIndexOriginal', 'color'
];

var defaultHeatmapColors = {
  3: ['00B', 'DDD', 'F00'],
  5: ['00D', '66D', 'DDD', 'F88', 'F00'],
  17: [
    '00D', '00D', '00D', '00D', '00D', '44D', '44D', 'DDD', 'DDD',
    'DDD', 'DDD', 'F88', 'F66', 'F22', 'F22', 'F00', 'F00', 'F00'
  ]
};

/**
 * Get label text for displayed tracks from annotation container metadata,
 * heatmap keys, or annotation container keys
 */
function getLabels(ideo) {
  var annotKeys, labels, heatmaps, i;

  if (ideo.rawAnnots.metadata && ideo.rawAnnots.metadata.trackLabels) {
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

/**
 * Apply heatmap thresholds that are passed in as annotation metadata
 */
function inflateThresholds(ideo) {
  var thresholds, colors,
    rawAnnots = ideo.rawAnnots;

  if (
    rawAnnots.metadata && !rawAnnots.metadata.heatmapThresholds &&
    !ideo.config.heatmapThresholds
  ) {
    return;
  }

  if (ideo.config.heatmapThresholds) {
    thresholds = ideo.config.heatmapThresholds;
  } else {
    thresholds = ideo.rawAnnots.metadata.heatmapThresholds;
  }

  colors = defaultHeatmapColors[thresholds.length + 1];
  thresholds = thresholds.map((d, i) => {
    return [d, '#' + colors[i]];
  });

  thresholds.push(['+', '#' + colors.slice(-1)[0]]);

  return thresholds;
}

/**
 * Set needed configuration options from raw annotation data.
 * Simplifies heatmap API by inferring reasonable defaults.
 */
function inflateHeatmaps(ideo) {
  var i, labels, heatmaps, annotationTracks, rawAnnots, displayedTracks,
    thresholds = ideo.config.heatmapThresholds;

  heatmaps = [];
  rawAnnots = ideo.rawAnnots;
  labels = rawAnnots.keys.slice(3);

  annotationTracks = [];
  displayedTracks = [];
  if (rawAnnots.metadata || !isNaN(thresholds[0])) {
    thresholds = inflateThresholds(ideo);
  }

  for (i = 0; i < labels.length; i++) {
    heatmaps.push({key: labels[i], thresholds: thresholds});
    annotationTracks.push({id: labels[i]});
    displayedTracks.push(i + 1);
  }
  ideo.config.annotationsNumTracks = labels.length;
  ideo.config.annotationsDisplayedTracks = displayedTracks;
  ideo.config.heatmaps = heatmaps;
  ideo.config.annotationTracks = annotationTracks;
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
  var m, numThresholds, thresholdList, threshold, tvNum, thresholdColor,
    prevThreshold, useThresholdColor, color;

  for (m = 0; m < thresholds.length; m++) {
    numThresholds = thresholds.length - 1;
    thresholdList = thresholds[m];
    threshold = thresholdList[0];

    // The threshold value is usually a number,
    // but can also be a "+" character indicating that
    // this threshold is anything greater than the previous threshold.
    tvNum = parseFloat(threshold);
    if (isNaN(tvNum) === false) threshold = tvNum;
    if (m !== 0) prevThreshold = parseFloat(thresholds[m - 1][0]);
    thresholdColor = thresholdList[1];

    useThresholdColor = shouldUseThresholdColor(m, numThresholds, value,
      prevThreshold, threshold);

    if (useThresholdColor) color = thresholdColor;
  }

  return color;
}

export {
  getLabels, inflateHeatmaps, inflateThresholds, defaultHeatmapColors,
  getHeatmapAnnotColor
};
