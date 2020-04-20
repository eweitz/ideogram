import {d3} from '../lib';
import {
  getRegionsR1AndR2, writeSyntenicRegionPolygonsHorizontal, writeSyntenicRegion
} from './synteny-lib';

function writeSyntenicRegionLines(syntenicRegion, y1, y2, r1, r2) {
  syntenicRegion.append('line')
    .attr('class', 'syntenyBorder')
    .attr('x1', r1.startPx)
    .attr('x2', r2.startPx)
    .attr('y1', y1)
    .attr('y2', y2);

  syntenicRegion.append('line')
    .attr('class', 'syntenyBorder')
    .attr('x1', r1.stopPx)
    .attr('x2', r2.stopPx)
    .attr('y1', y1)
    .attr('y2', y2);
}

function writeSyntenicRegions(syntenicRegions, syntenies, ideo) {
  var i, regions, r1, r2, regionID, syntenicRegion, chrWidth, y1, y2;

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
    y1 = chrWidth + 31;
    y2 = chrWidth + 201; // Genomes are spaced ~200 pixels apart

    writeSyntenicRegionPolygonsHorizontal(syntenicRegion, y1, y2, r1, r2, regions);
    writeSyntenicRegionLines(syntenicRegion, y1, y2, r1, r2);
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
function drawSyntenyCollinearHorizontal(syntenicRegions, ideo) {
  var syntenies,
    t0 = new Date().getTime();

  syntenies = d3.select(ideo.selector)
    .insert('g', ':first-child')
    .attr('class', 'synteny');

  writeSyntenicRegions(syntenicRegions, syntenies, ideo);

  reportPerformance(t0, ideo);
}

export {drawSyntenyCollinearHorizontal};
