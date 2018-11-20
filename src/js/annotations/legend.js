import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

function writeHeatmapLegend(ideo) {
  var heatmaps, thresholdHasLabel, i, j, thresholds, threshold, legend,
    color, label;

  legend = [];
  heatmaps = config.heatmaps,
  thresholdHasLabel = heatmaps[0].thresholds[0].length > 2;

  if (!thresholdHasLabel) return;

  for (i = 0; i < heatmaps.length; i++) {
    thresholds = heatmaps[i].thresholds;
    for (j = 0; j < thresholds.length; j++) {
      threshold = thresholds[j];
      color = '<rect style="clear: left; height: 10px;" fill="' + threshold[1] + '"/>';
      label = '<text>' + threshold[2] + '</text>';
      legend.push(color + label);
    }
  }
  legend = '<g>' + legend.join('</g><g>') + '</g>';

  console.log(legend);

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