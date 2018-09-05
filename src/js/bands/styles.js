var staticColors, staticCss, staticGradients;

staticColors = [
  ['gneg', '#FFF', '#FFF', '#DDD'],
  ['gpos25', '#C8C8C8', '#DDD', '#BBB'],
  ['gpos33', '#BBB', '#BBB', '#AAA'],
  ['gpos50', '#999', '#AAA', '#888'],
  ['gpos66', '#888', '#888', '#666'],
  ['gpos75', '#777', '#777', '#444'],
  ['gpos100', '#444', '#666', '#000'],
  ['acen', '#FEE', '#FEE', '#FDD'],
  ['noBands', '#BBB', '#BBB', '#AAA']
];

staticCss =
  '<style>' +
  'svg#_ideogram  {padding-left: 5px;} ' +
  'svg#_ideogram .labeled {padding-left: 15px;} ' +
  'svg#_ideogram.labeledLeft {padding-left: 15px; padding-top: 15px;} ' +
  // Tahoma has great readability and space utilization at small sizes
  // More: http://ux.stackexchange.com/a/3334
  '#_ideogram text {font: 9px Tahoma; fill: #000;} ' +
  '#_ideogram .italic {font-style: italic;} ' +
  '#_ideogram .chromosome {cursor: pointer; fill: #AAA;}' +
  '#_ideogram .chrSetLabel {font-weight: bolder;}' +
  '#_ideogram .ghost {opacity: 0.2;}' +
  '#_ideogram .hidden {display: none;}' +
  '#_ideogram .bandLabelStalk line {stroke: #AAA; stroke-width: 1;}' +
  '#_ideogram .syntenyBorder {stroke:#AAA;stroke-width:1;}' +
  '#_ideogram .brush .selection {' +
  '  fill: #F00;' +
  '  stroke: #F00;' +
  '  fill-opacity: .3;' +
  '  shape-rendering: crispEdges;' +
  '}' +
  '#_ideogram .noBands {fill: #AAA;}' +
  // NCBI stain density colors
  '#_ideogram .gneg {fill: #FFF}' +
  '#_ideogram .gpos25 {fill: #BBB}' +
  '#_ideogram .gpos33 {fill: #AAA}' +
  '#_ideogram .gpos50 {fill: #888}' +
  '#_ideogram .gpos66 {fill: #666}' +
  '#_ideogram .gpos75 {fill: #444}' +
  '#_ideogram .gpos100 {fill: #000}' +
  '#_ideogram .gpos {fill: #000}' +
  '#_ideogram .acen {fill: #FDD}' +
  '#_ideogram .stalk {fill: #CCE;}' +
  '#_ideogram .gvar {fill: #DDF}' +
  // Used when overlaid with annotations
  '#_ideogram.faint .gneg {fill: #FFF}' +
  '#_ideogram.faint .gpos25 {fill: #EEE}' +
  '#_ideogram.faint .gpos33 {fill: #EEE}' +
  '#_ideogram.faint .gpos50 {fill: #EEE}' +
  '#_ideogram.faint .gpos66 {fill: #EEE}' +
  '#_ideogram.faint .gpos75 {fill: #EEE}' +
  '#_ideogram.faint .gpos100 {fill: #DDD}' +
  '#_ideogram.faint .gpos {fill: #DDD}' +
  '#_ideogram.faint .acen {fill: #FEE}' +
  '#_ideogram.faint .stalk {fill: #EEF;}' +
  '#_ideogram.faint .gvar {fill: #EEF}' +
  '#_ideogram .gneg {fill: url("#gneg")} ' +
  '#_ideogram .gpos25 {fill: url("#gpos25")} ' +
  '#_ideogram .gpos33 {fill: url("#gpos33")} ' +
  '#_ideogram .gpos50 {fill: url("#gpos50")} ' +
  '#_ideogram .gpos66 {fill: url("#gpos66")} ' +
  '#_ideogram .gpos75 {fill: url("#gpos75")} ' +
  '#_ideogram .gpos100 {fill: url("#gpos100")} ' +
  '#_ideogram .gpos {fill: url("#gpos100")} ' +
  '#_ideogram .acen {fill: url("#acen")} ' +
  '#_ideogram .stalk {fill: url("#stalk")} ' +
  '#_ideogram .gvar {fill: url("#gvar")} ' +
  '#_ideogram .noBands {fill: url("#noBands")} ' +
  '#_ideogram .chromosome {fill: url("#noBands")} ' +
  '</style>';

staticGradients =
  '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse" ' +
  'patternTransform="rotate(30 0 0)">' +
  '<rect x="0" y="0" width="10" height="2" fill="#CCE" /> ' +
  '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B; ' +
  'stroke-width:0.7;" />' +
  '</pattern>' +
  '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse" ' +
  'patternTransform="rotate(-30 0 0)">' +
  '<rect x="0" y="0" width="10" height="2" fill="#DDF" /> ' +
  '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C; ' +
  'stroke-width:0.7;" />' +
  '</pattern>';

export {staticColors, staticCss, staticGradients};