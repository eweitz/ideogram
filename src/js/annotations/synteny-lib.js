import {d3} from '../lib';

export function writeSyntenicRegion(syntenies, regionID, ideo) {
  return syntenies.append('g')
    .attr('class', 'syntenicRegion')
    .attr('id', regionID)
    .on('click', function() {
      var activeRegion = this;
      var others = d3.selectAll(ideo.selector + ' .syntenicRegion')
        .filter(function() {return (this !== activeRegion);});

      others.classed('hidden', !others.classed('hidden'));
    })
    .on('mouseover', function() {
      var activeRegion = this;
      d3.selectAll(ideo.selector + ' .syntenicRegion')
        .filter(function() {return (this !== activeRegion);})
        .classed('ghost', true);
    })
    .on('mouseout', function() {
      d3.selectAll(ideo.selector + ' .syntenicRegion')
        .classed('ghost', false);
    });
}

export function writeSyntenicRegionPolygons(syntenicRegion, x1, x2, r1, r2, regions) {
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

export function writeSyntenicRegionPolygonsHorizontal(syntenicRegion, y1, y2, r1, r2, regions) {
  var color, opacity;

  color = ('color' in regions) ? regions.color : '#CFC';
  opacity = ('opacity' in regions) ? regions.opacity : 1;

  syntenicRegion.append('polygon')
    .attr('points',
      (r1.startPx - 15) + ', ' + y1 + ' ' +
      (r1.stopPx - 15) + ', ' + y1 + ' ' +
      (r2.stopPx - 15) + ', ' + y2 + ' ' +
      (r2.startPx - 15) + ', ' + y2
    )
    .style('fill', color)
    .style('fill-opacity', opacity);
}

export function getRegionsR1AndR2(regions, ideo, xOffset = null) {
  var r1, r2,
    r1Offset, r2Offset;

  r1 = regions.r1;
  r2 = regions.r2;

  if (typeof r1.chr === 'string') {
    const taxids = ideo.config.taxids;
    if (ideo.config.multiorganism) {
      r1.chr = ideo.chromosomes[taxids[0]][r1.chr];
      r2.chr = ideo.chromosomes[taxids[1]][r2.chr];
    } else {
      r1.chr = ideo.chromosomes[taxids[0]][r1.chr];
      r2.chr = ideo.chromosomes[taxids[0]][r2.chr];
    }
  }

  var r1ChrDom = document.querySelector('#' + r1.chr.id + '-chromosome-set');
  var r1GenomeHorizontalXOffset = r1ChrDom.getCTM().e;
  var r1GenomeVerticalXOffset = r1ChrDom.getCTM().f;
  var r2ChrDom = document.querySelector('#' + r2.chr.id + '-chromosome-set');
  // var r2GenomeOffset = r2ChrDom.getBoundingClientRect().top;
  var r2GenomeHorizontalXOffset = r2ChrDom.getCTM().e;
  var r2GenomeVerticalXOffset = r2ChrDom.getCTM().f;

  if (xOffset === null) {
    if (ideo.config.orientation === 'vertical') {
      // When vertical collinear
      // http://localhost:8080/examples/vanilla/compare-whole-genomes?chromosome-scale=absolute&orientation=vertical
      r1Offset = r1GenomeVerticalXOffset - 12;
      r2Offset = r2GenomeVerticalXOffset - 12;
    } else {
      // When horizontal collinear, e.g.
      // http://localhost:8080/examples/vanilla/compare-whole-genomes?chromosome-scale=absolute&orientation=horizontal
      r1Offset = r1GenomeHorizontalXOffset;
      r2Offset = r2GenomeHorizontalXOffset;
    }
  } else {
    // When horizontal parallel
    r1Offset = xOffset;
    r2Offset = xOffset;
  }

  r1.startPx = ideo.convertBpToPx(r1.chr, r1.start) + r1Offset;
  r1.stopPx = ideo.convertBpToPx(r1.chr, r1.stop) + r1Offset;
  r2.startPx = ideo.convertBpToPx(r2.chr, r2.start) + r2Offset;
  r2.stopPx = ideo.convertBpToPx(r2.chr, r2.stop) + r2Offset;

  return [r1, r2];
}
