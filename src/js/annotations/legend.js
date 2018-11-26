import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

var lineHeight = 19;

var legendStyle =
  '#_ideogramLegend {font: 12px Arial, line-height: 19.6px;} ' +
  '#_ideogramLegend svg {float: left;} ' +
  '#_ideogramLegend ul {' +
    'position: relative; left: -14px; list-style: none, float: left;' +
  '} ' +
  '#_ideogramLegend ul span {position: relative; left: -15px;} ';

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
    labels += '<span>' + list.name + '</span>';
    hasName = true;
  }
  return [labels, hasName];
}

function writeLegend(ideo) {
  var i, legend, hasName, svg, labels, list, content;

  legend = ideo.config.legend;
  content = '';

  for (i = 0; i < legend.length; i++) {
    list = legend[i];
    [labels, hasName] = getHeader(list);
    svg = '<svg width="' + lineHeight + '">';
    [labels, svg] = getListItems(labels, svg, hasName, list);
    svg += '</svg>'
    content += svg + '<ul>' + labels + '</ul>';
  }

  var target = d3.select(ideo.config.container + ' #_ideogramOuterWrap');
  target.append('style').html(legendStyle)
  target.append('div').attr('id', '_ideogramLegend').html(content);
}

export { writeLegend }