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

staticCss = [
  ' {padding-left: 5px;}',
  ' .labeled {padding-left: 15px;}',
  '.labeledLeft {padding-left: 15px; padding-top: 15px;}',
  // Tahoma has great readability and space utilization at small sizes
  // More: http://ux.stackexchange.com/a/3334
  ' text {font: 9px Tahoma; fill: #000;}',
  ' .italic {font-style: italic;}',
  ' .chromosome {cursor: pointer; fill: #AAA;}',
  ' .chrSetLabel {font-weight: bolder;}',
  ' .ghost {opacity: 0.2;}',
  ' .hidden {display: none;}',
  ' .bandLabelStalk line {stroke: #AAA; stroke-width: 1;}',
  ' .syntenyBorder {stroke:#AAA;stroke-width:1;}',
  ' .brush .selection {' +
    '  fill: #F00;' + 
    '  stroke: #F00;' + 
    '  fill-opacity: .3;' + 
    '  shape-rendering: crispEdges;' + 
    '}',
  ' .noBands {fill: #AAA;}',
  // NCBI stain density colors 
  // For browsers without linearGradient support, i.e. no sheen
  ' .gneg {fill: #FFF}',
  ' .gpos25 {fill: #BBB}',
  ' .gpos33 {fill: #AAA}',
  ' .gpos50 {fill: #888}',
  ' .gpos66 {fill: #666}',
  ' .gpos75 {fill: #444}',
  ' .gpos100 {fill: #000}',
  ' .gpos {fill: #000}',
  ' .acen {fill: #FDD}',
  ' .stalk {fill: #CCE;}',
  ' .gvar {fill: #DDF}',
  // Used when overlaid with annotations
  '.faint .gneg {fill: #FFF}',
  '.faint .gpos25 {fill: #EEE}',
  '.faint .gpos33 {fill: #EEE}',
  '.faint .gpos50 {fill: #EEE}',
  '.faint .gpos66 {fill: #EEE}',
  '.faint .gpos75 {fill: #EEE}',
  '.faint .gpos100 {fill: #DDD}',
  '.faint .gpos {fill: #DDD}',
  '.faint .acen {fill: #FEE}',
  '.faint .stalk {fill: #EEF;}',
  '.faint .gvar {fill: #EEF}',
  // For sheen, i.e. the soft shine in chromosomes
  ' .gneg {fill: url("#gneg")}',
  ' .gpos25 {fill: url("#gpos25")}',
  ' .gpos33 {fill: url("#gpos33")}',
  ' .gpos50 {fill: url("#gpos50")}',
  ' .gpos66 {fill: url("#gpos66")}',
  ' .gpos75 {fill: url("#gpos75")}',
  ' .gpos100 {fill: url("#gpos100")}',
  ' .gpos {fill: url("#gpos100")}',
  ' .acen {fill: url("#acen")}',
  ' .stalk {fill: url("#stalk")}',
  ' .gvar {fill: url("#gvar")}',
  ' .noBands {fill: url("#noBands")}',
  ' .chromosome {fill: url("#noBands")}'];

staticGradients =
  '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse"' +
  'patternTransform="rotate(30 0 0)">' +
  '<rect x="0" y="0" width="10" height="2" fill="#CCE" />' +
  '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B;' +
  'stroke-width:0.7;" />' +
  '</pattern>' +
  '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse"' +
  'patternTransform="rotate(-30 0 0)">' +
  '<rect x="0" y="0" width="10" height="2" fill="#DDF" />' +
  '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C;' +
  'stroke-width:0.7;" />' +
  '</pattern>';

export {staticColors, staticCss, staticGradients};