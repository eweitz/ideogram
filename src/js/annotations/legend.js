import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

var lineHeight = 19;

function getListItems(labels, svg, hasDisplayName, heatmap) {
  var j, threshold, color, label, y;

  for (j = 0; j < heatmap.thresholds.length; j++) {
    threshold = heatmap.thresholds[j];
    y = j * lineHeight;
    if (hasDisplayName) y += lineHeight;
    color = '<rect height="10" width="10" y="5" fill="' + threshold[1] + '"/>';
    label = '<li>' + threshold[2] + '</li>';
    svg += '<g transform="translate(0, ' + y + ')">' + color + '</g>'
    labels += label;
  }

  return [labels, svg];
}

function getHeader(heatmap) {
  var labels, hasDisplayName;
  labels = '';
  hasDisplayName = false;
  if ('displayName' in heatmap) {
    labels +=
      '<span style="position: relative; left: -15px;">' +
        heatmap.displayName +
      '</span>';
    hasDisplayName = true;
  }
  return [labels, hasDisplayName];
}

function writeHeatmapLegend(ideo) {
  var heatmaps, thresholdHasLabel, i, heatmap, legend, hasDisplayName, svg,
    labels, legendStyle;

  heatmaps = ideo.config.heatmaps;
  thresholdHasLabel = heatmaps[0].thresholds[0].length > 2;
  if (!thresholdHasLabel) return;

  legend = '';
  legendStyle = 'position: relative; top: -11px; left: -14px;';

  for (i = 0; i < heatmaps.length; i++) {
    heatmap = heatmaps[i];
    [labels, hasDisplayName] = getHeader(heatmap);
    svg = '<svg width="' + lineHeight + '" style="float: left">';
    [labels, svg] = getListItems(labels, svg, hasDisplayName, heatmap);
    svg += '</svg>'
    legend += svg + '<ul style="' + legendStyle + '">' + labels + '</ul>';
  }

  d3.select(ideo.config.container + ' #_ideogramOuterWrap')
    .append('div')
      .attr('id', '_ideogramLegend')
      .html(legend);
}

function writeLegend(ideo) {
  var config = ideo.config;
  if (config.heatmaps) {
    writeHeatmapLegend(ideo);
  }
}

export { writeLegend }