/**
 * @fileoverview Functions used by parallel and collinear heatmaps.
 */

var reservedTrackKeys = [
  'name', 'start', 'length', 'trackIndex', 'trackIndexOriginal', 'color'
];

var defaultHeatmapColors = [
  ['00B', 'F00'],
  ['00B', 'DDD', 'F00'],
  ['00B', 'AAB', 'FAA', 'F00'],
  ['00B', 'AAB', 'DDD', 'FAA', 'F00'],
  [], [], [], [], [], [], [], [], [], [], [], // TODO: Use color palette module
  ['00D', '22D', '44D', '66D', '88D', 'AAD', 'CCD', 'DDD', 'FCC', 'FAA', 'F88', 'F66', 'F44', 'F22', 'F00']
]

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
  var thresholds, colors, crudeThresholds;

  if (!ideo.rawAnnots.metadata.heatmapThresholds) return;

  thresholds = ideo.rawAnnots.metadata.heatmapThresholds;
  
  colors = defaultHeatmapColors[thresholds.length - 1];
  thresholds = thresholds.map((d, i) => {
    return [d, '#' + colors[i]];
  });

  // Coarsen thresholds, emphasize outliers, widen normal range.
  // TODO: Generalize this for arbitrary number of thresholds.
  crudeThresholds = [
    [thresholds[4][0], thresholds[0][1]],
    [thresholds[6][0], thresholds[3][1]],
    [thresholds[9][0], thresholds[7][1]],
    [thresholds[11][0], thresholds[10][1]],
    [thresholds[14][0], thresholds[14][1]]
  ]

  thresholds = crudeThresholds;

  thresholds[thresholds.length - 1][0] = '+';

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
  labels = rawAnnots.keys.slice(3,);

  annotationTracks = [];
  displayedTracks = [];
  if (rawAnnots.metadata) thresholds = inflateThresholds(ideo);

  for (i = 0; i < labels.length; i++) {
    heatmaps.push({key: labels[i], thresholds: thresholds});
    annotationTracks.push({id: labels[i]});
    displayedTracks.push(i + 1)
  }
  ideo.config.annotationsNumTracks = labels.length;
  ideo.config.annotationsDisplayedTracks = displayedTracks;
  ideo.config.heatmaps = heatmaps;
  ideo.config.annotationTracks = annotationTracks;
}

export {getLabels, inflateHeatmaps};