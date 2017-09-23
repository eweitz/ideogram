import * as d3selection from 'd3-selection';
// See https://github.com/d3/d3/issues/2733
import {event as currentEvent} from 'd3-selection';
import * as d3brush from 'd3-brush';
import {scaleLinear} from 'd3-scale';
import {max} from 'd3-array';

var d3 = Object.assign({}, d3brush, d3selection);
d3.scaleLinear = scaleLinear;
d3.max = max;

/**
 * Custom event handler, fired upon dragging sliding window on chromosome
 */
function onBrushMove() {
  call(this.onBrushMoveCallback);
}

/**
 * Creates a sliding window along a chromosome
 *
 * @param from Genomic start coordinate, in base pairs
 * @param to Genomic end coordinate, in base pairs
 */
function createBrush(from, to) {
  var ideo = this,
    width = ideo.config.chrWidth + 6.5,
    length = ideo.config.chrHeight,
    chr = ideo.chromosomesArray[0],
    chrLengthBp = chr.bands[chr.bands.length - 1].bp.stop,
    x0, x1,
    xOffset = this._layout.getMargin().left,
    xScale = d3.scaleLinear()
      .domain([0, d3.max(chr.bands, function(band) {
        return band.bp.stop;
      })]).range([xOffset, d3.max(chr.bands, function(band) {
        return band.px.stop;
      }) + xOffset]);

  if (typeof from === 'undefined') {
    from = Math.floor(chrLengthBp / 10);
  }

  if (typeof right === 'undefined') {
    to = Math.ceil(from * 2);
  }

  x0 = ideo.convertBpToPx(chr, from);
  x1 = ideo.convertBpToPx(chr, to);

  ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

  ideo.brush = d3.brushX()
    .extent([[xOffset, 0], [length + xOffset, width]])
    .on('brush', onBrushMove);

  var yTranslate = this._layout.getChromosomeSetYTranslate(0);
  var yOffset = yTranslate + (ideo.config.chrWidth - width) / 2;
  d3.select(ideo.selector).append('g')
    .attr('class', 'brush')
    .attr('transform', 'translate(0, ' + yOffset + ')')
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);

  function onBrushMove() {
    var extent = currentEvent.selection.map(xScale.invert),
      from = Math.floor(extent[0]),
      to = Math.ceil(extent[1]);

    ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
  }
}

export {onBrushMove, createBrush};