import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

function writeHeatmapLegend(ideo) {
  var heatmaps, thresholdHasLabel, i, j, thresholds, threshold, legend,
    row, y, color, label;

  legend = [];
  heatmaps = ideo.config.heatmaps,
  thresholdHasLabel = heatmaps[0].thresholds[0].length > 2;

  if (!thresholdHasLabel) return;

  for (i = 0; i < heatmaps.length; i++) {
    thresholds = heatmaps[i].thresholds;
    for (j = 0; j < thresholds.length; j++) {
      threshold = thresholds[j];
      y = (j + 1) * 14;
      if (i !== 0) y += heatmaps[i - 1].thresholds.length * 14 + 14;
      color = '<rect height="10" width="10" y="5" fill="' + threshold[1] + '"/>';
      label = '<text x="15" y="14">' + threshold[2] + '</text>';
      row = color + label
      row = '<g transform="translate(0, ' + y + ')">' + row + '</g>'
      legend.push(row);
    }
  }

  d3.select(ideo.config.container + ' #_ideogramOuterWrap')
    .append('svg')
      .attr('id', 'legend')
      .html(legend);
}

function writeLegend(ideo) {
  var config = ideo.config;
  if (config.heatmaps) {
    writeHeatmapLegend(ideo);
  }
}

export { writeLegend }