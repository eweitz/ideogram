import {d3} from '../lib';

function writeSyntenicRegion(syntenies, regionID, ideo) {
  return syntenies.append('g')
    .attr('class', 'syntenicRegion')
    .attr('id', regionID)
    .on('click', function() {
      var activeRegion = this;
      var others = d3.selectAll(ideo.selector + ' .syntenicRegion')
        .filter(function() { return (this !== activeRegion); });

      others.classed('hidden', !others.classed('hidden'));
    })
    .on('mouseover', function() {
      var activeRegion = this;
      d3.selectAll(ideo.selector + ' .syntenicRegion')
        .filter(function() { return (this !== activeRegion); })
        .classed('ghost', true);
    })
    .on('mouseout', function() {
      d3.selectAll(ideo.selector + ' .syntenicRegion')
        .classed('ghost', false);
    });
}

function getRegionsR1AndR2(regions, ideo) {
  var r1, r2;

  r1 = regions.r1;
  r2 = regions.r2;

  // var r1ChrLengthPx = r1.chr.bands.slice(-1)[0].px.stop;
  // var r2ChrLengthPx = r2.chr.bands.slice(-1)[0].px.stop;
  // var ratio = r2ChrLengthPx / r1ChrLengthPx;
  var r1ChrDom = document.querySelector('#' + r1.chr.id + '-chromosome-set');
  var r1GenomeOffset = r1ChrDom.getCTM().f;
  var r2ChrDom = document.querySelector('#' + r2.chr.id + '-chromosome-set');
  // var r2GenomeOffset = r2ChrDom.getBoundingClientRect().top;
  var r2GenomeOffset = r2ChrDom.getCTM().f;

  // r1.startPx = ideo.convertBpToPx(r1.chr, r1.start) * ratio + r1GenomeOffset - 7;
  r1.startPx = ideo.convertBpToPx(r1.chr, r1.start) + r1GenomeOffset - 7;
  r1.stopPx = ideo.convertBpToPx(r1.chr, r1.stop) + r1GenomeOffset - 7;
  r2.startPx = ideo.convertBpToPx(r2.chr, r2.start) + r2GenomeOffset - 7;
  r2.stopPx = ideo.convertBpToPx(r2.chr, r2.stop) + r2GenomeOffset - 7;

  return [r1, r2];
}

function writeSyntenicRegionPolygons(syntenicRegion, x1, x2, r1, r2, regions) {
  var color, opacity;

  color = ('color' in regions) ? regions.color : '#CFC';
  opacity = ('opacity' in regions) ? regions.opacity : 1;

  syntenicRegion.append('polygon')
    .attr('points',
      x1 + ', ' + r1.startPx + ' ' +
      x1 + ', ' + r1.stopPx + ' ' +
      x2 + ', ' + r2.stopPx + ' ' +
      x2 + ', ' + r2.startPx
    )
    .style('fill', color)
    .style('fill-opacity', opacity);
}

function writeSyntenicRegionLines(syntenicRegion, x1, x2, r1, r2) {
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

function writeSyntenicRegions(syntenicRegions, syntenies, xOffset, ideo) {
  var i, regions, r1, r2, regionID, syntenicRegion, chrWidth, x1, x2;

  for (i = 0; i < syntenicRegions.length; i++) {
    regions = syntenicRegions[i];

    [r1, r2] = getRegionsR1AndR2(regions, ideo);

    regionID = (
      r1.chr.id + '_' + r1.start + '_' + r1.stop + '_' +
      '__' +
      r2.chr.id + '_' + r2.start + '_' + r2.stop
    );

    syntenicRegion = writeSyntenicRegion(syntenies, regionID, ideo);

    chrWidth = ideo.config.chrWidth;
    x1 = chrWidth + 9;
    x2 = chrWidth + 210; // Genomes are spaced ~200 pixels apart

    writeSyntenicRegionPolygons(syntenicRegion, x1, x2, r1, r2, regions);
    writeSyntenicRegionLines(syntenicRegion, x1, x2, r1, r2);
  }
}

function reportPerformance(t0, ideo) {
  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time in drawSyntenicRegions: ' + (t1 - t0) + ' ms');
  }
}

/**
 * Draws a trapezoid connecting a genomic range on
 * one chromosome to a genomic range on another chromosome;
 * a syntenic region.
 */
function drawSyntenyCollinear(syntenicRegions, ideo) {
  var syntenies, xOffset,
    t0 = new Date().getTime();

  syntenies = d3.select(ideo.selector)
    .insert('g', ':first-child')
    .attr('class', 'synteny');

  xOffset = ideo._layout.margin.left;

  writeSyntenicRegions(syntenicRegions, syntenies, xOffset, ideo);

  reportPerformance(t0, ideo);
}

export {drawSyntenyCollinear};
