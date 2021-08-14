import {d3} from '../lib';
import {
  getRegionsR1AndR2, writeSyntenicRegionPolygons, writeSyntenicRegion
} from './synteny-lib';

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

function writeSyntenicRegions(syntenicRegions, syntenies, ideo) {
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
    x1 = chrWidth + 51;
    x2 = chrWidth + 245; // Genomes are spaced ~200 pixels apart

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
  var syntenies,
    t0 = new Date().getTime();

  syntenies = d3.select(ideo.selector)
    .insert('g', ':first-child')
    .attr('class', 'synteny');

  writeSyntenicRegions(syntenicRegions, syntenies, ideo);

  reportPerformance(t0, ideo);
}

export {drawSyntenyCollinear};
