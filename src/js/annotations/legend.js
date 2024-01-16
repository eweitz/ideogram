/**
 * @fileoverview Functions for drawing a legend for genome annotations.
 * A legend consists of rows, each with a colored icon and a text label.
 * Icons may have different shapes.  A legend may also have a name.
 */

import {d3, getTextSize, round} from '../lib';

var legendStyle =
  '#_ideogramLegend {font: 12px Arial; overflow: auto; cursor: default;} ' +
  '#_ideogramLegend svg {float: left;} ' +
  '#_ideogramLegend ul {' +
    'position: relative; left: -14px; list-style: none; float: left; ' +
    'padding-left: 10px; margin: 0 0 1em 0; width: auto; border: none;' +
  '} ' +
  '#_ideogramLegend li {float: none; margin: 0;}' +
  '#_ideogramLegend ul span {position: relative; left: -15px;} ';

export function getIcon(row, ideo) {
  var icon, triangleAttrs, circleAttrs, rectAttrs,
    fill = 'fill="' + row.color + '" style="stroke: #AAA;"',
    shape = row.shape;

  triangleAttrs = 'd="m7,3 l -5 9 l 9 0 z"';
  circleAttrs = 'd="m2,9a 4.5,4.5 0 1,0 9,0a 4.5,4.5 0 1,0 -9,0"';
  rectAttrs = 'height="10" width="10" y="3"';

  if ('shape' in row && ['circle', 'triangle'].includes(shape)) {
    if (shape === 'circle') {
      icon = '<path ' + circleAttrs + ' ' + fill + '></path>';
    } else if (shape === 'triangle') {
      var transform = '';
      if (ideo.config.orientation === 'vertical') {
        // Orient arrows in legend as they are in annotations
        transform = ' transform="rotate(90, 7, 7)"';
      }
      if (ideo.config.orientation === 'down') {
        transform = ' transform="rotate(180, 7, 7)"';
      }
      icon = '<path ' + triangleAttrs + transform + ' ' + fill + '></path>';
    }
  } else {
    icon = '<rect ' + rectAttrs + ' ' + fill + '/>';
  }

  return icon;
}

function getListItems(labels, svg, list, nameHeight, ideo) {
  var i, icon, y, row,
    lineHeight = getLineHeight(ideo);

  for (i = 0; i < list.rows.length; i++) {
    row = list.rows[i];
    labels += '<li class="_ideoLegendEntry">' + row.name + '</li>';
    y = lineHeight * (i - 1) + nameHeight + 1;
    if ('name' in list) y += lineHeight;
    icon = getIcon(row, ideo);
    const transform = 'translate(0, ' + y + ')';
    svg += '<g transform="' + transform + '">' + icon + '</g>';
  }

  return [labels, svg];
}

function getLineHeight(ideo) {
  return round(getTextSize('A', ideo).height) * 2 + 0.5;
}

/**
 * Display a legend for genome annotations, using `legend` configuration option
 */
function writeLegend(ideo) {
  var i, legend, svg, labels, list, content,
    config = ideo.config,
    lineHeight = getLineHeight(ideo);

  d3.select(config.container + ' #_ideogramLegend').remove();

  legend = config.legend;
  content = '';

  for (i = 0; i < legend.length; i++) {
    list = legend[i];
    let nameHeight = lineHeight;
    if (list.nameHeight) {
      nameHeight = list.nameHeight;
    }
    let nameStyle = '';
    if (nameHeight) {
      nameStyle =
        `style="height: ${nameHeight}px; ` +
        `position: relative; ` +
        `left: -${nameHeight - 5}px;"`;
    }
    if ('name' in list) {
      labels =
        `<li class="_ideoLegendName" ${nameStyle}>` + list.name + `</li>`;
    }
    svg = '<svg id="_ideogramLegendSvg" width="' + lineHeight + '">';
    [labels, svg] = getListItems(labels, svg, list, nameHeight, ideo);
    svg += '</svg>';
    content += svg + '<ul>' + labels + '</ul>';
  }

  var fontFamily = `font-family: ${config.fontFamily};`;
  var lineHeightCss = `line-height: ${getLineHeight(ideo)}px;`;
  legendStyle +=
    `#_ideogramLegend {${fontFamily} ${lineHeightCss}}`;

  var target = d3.select(config.container + ' #_ideogramOuterWrap');
  target.append('style').html(legendStyle);
  target.append('div').attr('id', '_ideogramLegend').html(content);
}

export {writeLegend};
