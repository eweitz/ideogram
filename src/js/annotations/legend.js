import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

var lineHeight = 19;

function getListItems(labels, svg, hasName, list) {
  var i, color, y, rectAttrs, row;

  rectAttrs = 'height="10" width="10"  y="5" style="stroke: #888;"';

  for (i = 0; i < list.rows.length; i++) {
    row = list.rows[i];
    labels += '<li>' + row.name + '</li>';
    y = lineHeight * i;
    if (hasName) y += lineHeight;
    color = '<rect ' + rectAttrs + ' fill="' + row.color + '"/>';
    svg += '<g transform="translate(0, ' + y + ')">' + color + '</g>';
  }

  return [labels, svg];
}

function getHeader(list) {
  var labels, hasName;
  labels = '';
  hasName = false;
  if ('name' in list) {
    labels +=
      '<span style="position: relative; left: -15px;">' +
        list.name +
      '</span>';
    hasName = true;
  }
  return [labels, hasName];
}

function writeLegend(ideo) {
  var i, legend, hasName, svg, labels, legendStyle, list, content;

  legend = ideo.config.legend;
  content = '';
  legendStyle = 'position: relative; top: -11px; left: -14px;';

  for (i = 0; i < legend.length; i++) {
    list = legend[i];
    [labels, hasName] = getHeader(list);
    svg = '<svg width="' + lineHeight + '" style="float: left">';
    [labels, svg] = getListItems(labels, svg, hasName, list);
    svg += '</svg>'
    content += svg + '<ul style="' + legendStyle + '">' + labels + '</ul>';
  }

  d3.select(ideo.config.container + ' #_ideogramOuterWrap')
    .append('div')
      .attr('id', '_ideogramLegend')
      .html(content);
}

export { writeLegend }