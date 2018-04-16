import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

/**
 * Draws a trapezoid connecting a genomic range on
 * one chromosome to a genomic range on another chromosome;
 * a syntenic region.
 */
function drawSynteny(syntenicRegions) {
  var t0 = new Date().getTime();

  var r1, r2,
    syntenies,
    i, color, opacity, xOffset,
    regionID, regions, syntenicRegion,
    ideo = this;

  syntenies = d3.select(ideo.selector)
    .insert('g', ':first-child')
    .attr('class', 'synteny');

  xOffset = ideo._layout.margin.left;

  for (i = 0; i < syntenicRegions.length; i++) {
    regions = syntenicRegions[i];

    r1 = regions.r1;
    r2 = regions.r2;

    color = '#CFC';
    if ('color' in regions) {
      color = regions.color;
    }

    opacity = 1;
    if ('opacity' in regions) {
      opacity = regions.opacity;
    }

    r1.startPx = this.convertBpToPx(r1.chr, r1.start) + xOffset;
    r1.stopPx = this.convertBpToPx(r1.chr, r1.stop) + xOffset;
    r2.startPx = this.convertBpToPx(r2.chr, r2.start) + xOffset;
    r2.stopPx = this.convertBpToPx(r2.chr, r2.stop) + xOffset;

    regionID = (
      r1.chr.id + '_' + r1.start + '_' + r1.stop + '_' +
      '__' +
      r2.chr.id + '_' + r2.start + '_' + r2.stop
    );

    syntenicRegion = syntenies.append('g')
      .attr('class', 'syntenicRegion')
      .attr('id', regionID)
      .on('click', function() {
        var activeRegion = this;
        var others = d3.selectAll(ideo.selector + ' .syntenicRegion')
          .filter(function() {
            return (this !== activeRegion);
          });

        others.classed('hidden', !others.classed('hidden'));
      })
      .on('mouseover', function() {
        var activeRegion = this;
        d3.selectAll(ideo.selector + ' .syntenicRegion')
          .filter(function() {
            return (this !== activeRegion);
          })
          .classed('ghost', true);
      })
      .on('mouseout', function() {
        d3.selectAll(ideo.selector + ' .syntenicRegion')
          .classed('ghost', false);
      });

    var chrWidth = ideo.config.chrWidth;
    var x1 = this._layout.getChromosomeSetYTranslate(0);
    var x2 = this._layout.getChromosomeSetYTranslate(1) - chrWidth;

    syntenicRegion.append('polygon')
      .attr('points',
        x1 + ', ' + r1.startPx + ' ' +
        x1 + ', ' + r1.stopPx + ' ' +
        x2 + ', ' + r2.stopPx + ' ' +
        x2 + ', ' + r2.startPx
      )
      .attr('style', 'fill: ' + color + '; fill-opacity: ' + opacity);

    syntenicRegion.append('line')
      .attr('class', 'syntenyBorder')
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', r1.startPx)
      .attr('y2', r2.startPx);

    syntenicRegion.append('line')
      .attr('class', 'syntenyBorder')
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', r1.stopPx)
      .attr('y2', r2.stopPx);
  }

  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in drawSyntenicRegions: ' + (t1 - t0) + ' ms');
  }
}

export {drawSynteny}