/**
 * @fileoverview Functions for drawing a legend for genome annotations.
 * A legend consists of rows, each with a colored icon and a text label.
 * Icons may have different shapes.  A legend may also have a name.
 */

import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

var lineHeight = 19;

var legendStyle =
  '#_ideogramLegend {font: 12px Arial; line-height: 19px;} ' +
  '#_ideogramLegend svg {float: left;} ' +
  '#_ideogramLegend ul {' +
    'position: relative; left: -14px; list-style: none; float: left; ' +
    'padding-left: 10px; margin-top: 0px; ' +
    'width: auto; ' +
    'border: none;' +
  '} ' +
  '#_ideogramLegend li {' +
    'float: none;' +
  '}' +
  '#_ideogramLegend ul span {position: relative; left: -15px;} ';

function getIcon(row) {
  var icon, triangleAttrs, circleAttrs, rectAttrs,
    fill = 'fill="' + row.color + '" style="stroke: #AAA;"',
    shape = row.shape;

  triangleAttrs = 'd="m7,3 l -5 9 l 9 0 z"';
  circleAttrs = 'd="m2,9a 4.5,4.5 0 1,0 9,0a 4.5,4.5 0 1,0 -9,0"';
  rectAttrs = 'height="10" width="10"  y="3"';

  if ('shape' in row && ['circle', 'triangle'].includes(shape)) {
    if (shape === 'circle') {
      icon = '<path ' + circleAttrs + ' ' + fill + '></path>';
    } else if (shape === 'triangle') {
      icon = '<path ' + triangleAttrs + ' ' + fill + '></path>';
    }
  } else {
    icon = '<rect ' + rectAttrs + ' ' + fill + '/>';
  }

  return icon;
}

function getListItems(labels, svg, list) {
  var i, icon, y, row;
  for (i = 0; i < list.rows.length; i++) {
    row = list.rows[i];
    labels += '<li>' + row.name + '</li>';
    y = lineHeight * i;
    if ('name' in list) y += lineHeight;
    icon = getIcon(row);
    svg += '<g transform="translate(0, ' + y + ')">' + icon + '</g>';
  }

  return [labels, svg];
}

/**
 * Display a legend for genome annotations, using `legend` configuration option
 */
function writeLegend(ideo) {
  var i, legend, svg, labels, list, content;

  d3.select(ideo.config.container + ' #_ideogramLegend').remove();

  legend = ideo.config.legend;
  content = '';

  for (i = 0; i < legend.length; i++) {
    list = legend[i];
    if ('name' in list) labels = '<span>' + list.name + '</span>';
    svg = '<svg width="' + lineHeight + '">';
    [labels, svg] = getListItems(labels, svg, list);
    svg += '</svg>'
    content += svg + '<ul>' + labels + '</ul>';
  }

  var target = d3.select(ideo.config.container + ' #_ideogramOuterWrap');
  target.append('style').html(legendStyle)
  target.append('div').attr('id', '_ideogramLegend').html(content);
}

export {writeLegend}