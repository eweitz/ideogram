import {d3} from '../lib';
import {drawSyntenyCollinear} from './synteny-collinear';
import {drawSyntenyCollinearHorizontal} from './synteny-collinear-horizontal';
import {
  getRegionsR1AndR2, writeSyntenicRegionPolygons, writeSyntenicRegion
} from './synteny-lib';

function writeSyntenicRegionLines(syntenicRegion, x1, x2, r1, r2, regions) {

  var stroke, width;
  if (
    Math.abs(r1.startPx - r1.startPx) < 2 &&
    Math.abs(r1.stopPx - r1.stopPx) < 2
  ) {
    stroke = regions.color;
    width = regions.width;
  } else {
    stroke = '';
    width = '';
  }

  syntenicRegion.append('line')
    .attr('class', 'syntenyBorder')
    .attr('x1', x1)
    .attr('x2', x2)
    .attr('y1', r1.startPx)
    .attr('y2', r2.startPx)
    .style('stroke', stroke)
    .style('stroke-width', width);

  syntenicRegion.append('line')
    .attr('class', 'syntenyBorder')
    .attr('x1', x1)
    .attr('x2', x2)
    .attr('y1', r1.stopPx)
    .attr('y2', r2.stopPx)
    .style('stroke', stroke)
    .style('stroke-width', stroke);
}

function writeSyntenicRegionLabels(syntenicRegion, x1, x2, r1, r2, regionId) {
  var rangeIds = regionId.split('__').map(d => 'label_' + d);
  if ('name' in r1) {
    syntenicRegion.append('text')
      .attr('id', rangeIds[0])
      .attr('y', r1.startPx + 3)
      .text(r1.name);
    var r1Width =
      document.querySelector('#' + rangeIds[0]).getBoundingClientRect().width;
    d3.select('#' + rangeIds[0]).attr('x', x1 - 15 - r1Width);
  }
  if ('name' in r2) {
    syntenicRegion.append('text')
      .attr('id', rangeIds[1])
      .text(r2.name)
      .attr('x', x2 + 15)
      .attr('y', r2.startPx + 3)
      .text(r2.name);
  }
}

function writeSyntenicRegions(syntenicRegions, syntenies, xOffset, ideo) {
  var i, regions, r1, r2, regionID, syntenicRegion, chrWidth, x1, x2;

  for (i = 0; i < syntenicRegions.length; i++) {
    regions = syntenicRegions[i];

    [r1, r2] = getRegionsR1AndR2(regions, ideo, xOffset);

    regionID = (
      r1.chr.id + '_' + r1.start + '_' + r1.stop + '_' +
      '__' +
      r2.chr.id + '_' + r2.start + '_' + r2.stop
    );

    syntenicRegion = writeSyntenicRegion(syntenies, regionID, ideo);

    chrWidth = ideo.config.chrWidth;
    x1 = ideo._layout.getChromosomeSetYTranslate(0);
    x2 = ideo._layout.getChromosomeSetYTranslate(1) - chrWidth;

    writeSyntenicRegionPolygons(syntenicRegion, x1, x2, r1, r2, regions);
    writeSyntenicRegionLines(syntenicRegion, x1, x2, r1, r2, regions);
    writeSyntenicRegionLabels(syntenicRegion, x1, x2, r1, r2, regionID);
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
function drawSynteny(syntenicRegions) {
  var syntenies, xOffset,
    t0 = new Date().getTime(),
    ideo = this,
    config = ideo.config;

  // Make synteny / orthologs readable from client apps
  ideo.syntenicRegions = syntenicRegions;

  if (
    config.multiorganism &&
    config.geometry === 'collinear'
  ) {
    if (config.orientation === 'vertical') {
      return drawSyntenyCollinear(syntenicRegions, ideo);
    } else {
      return drawSyntenyCollinearHorizontal(syntenicRegions, ideo);
    }
  }

  syntenies = d3.select(ideo.selector)
    .insert('g', ':first-child')
    .attr('class', 'synteny');

  xOffset = ideo._layout.margin.left;

  writeSyntenicRegions(syntenicRegions, syntenies, xOffset, ideo);

  reportPerformance(t0, ideo);
}

export {drawSynteny};
