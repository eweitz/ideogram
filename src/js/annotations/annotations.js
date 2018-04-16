/**
 * @fileoverview Methods for ideogram annotations.
 * Annotations are graphical objects that represent features of interest
 * located on the chromosomes, e.g. genes or variations.  They can
 * appear beside a chromosome, overlaid on top of it, or between multiple
 * chromosomes.
 */

import * as d3selection from 'd3-selection';
import * as d3fetch from 'd3-fetch';

import {BedParser} from '../parsers/bed-parser';
import {Object} from '../lib.js';
import {
  onLoadAnnots, onDrawAnnots, startHideAnnotTooltipTimeout,
  onWillShowAnnotTooltip, showAnnotTooltip
} from './annotation-events';
import {
  drawHeatmaps, deserializeAnnotsForHeatmap
} from './heatmap';
import {getHistogramBars} from './histogram';

var d3 = Object.assign({}, d3selection, d3fetch);

/**
 * Proccesses genome annotation data.
 * Genome annotations represent features like a gene, SNP, etc. as
 * a small graphical object on or beside a chromosome.
 * Converts raw annotation data from server, which is structured as
 * an array of arrays, into a more verbose data structure consisting
 * of an array of objects.
 * Also adds pixel offset information.
 */
function processAnnotData(rawAnnots) {
  var keys,
    i, j, k, m, annot, annots, annotsByChr,
    chr,
    chrModel, ra,
    startPx, stopPx, px, annotTrack, color, shape,
    ideo = this;

  keys = rawAnnots.keys;
  rawAnnots = rawAnnots.annots;

  annots = [];

  m = -1;
  for (i = 0; i < rawAnnots.length; i++) {

    annotsByChr = rawAnnots[i];

    chr = annotsByChr.chr;
    chrModel = ideo.chromosomes[ideo.config.taxid][chr];

    if (typeof chrModel === 'undefined') {
      console.warn(
        'Chromosome "' + chr + '" undefined in ideogram; ' +
        annotsByChr.annots.length + ' annotations not shown'
      );
      continue;
    }

    m++;
    annots.push({chr: annotsByChr.chr, annots: []});

    for (j = 0; j < annotsByChr.annots.length; j++) {
      ra = annotsByChr.annots[j];
      annot = {};

      for (k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot.stop = annot.start + annot.length;

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);

      px = Math.round((startPx + stopPx) / 2);

      color = ideo.config.annotationsColor;
      if (ideo.config.annotationTracks) {
        annot.trackIndex = ra[3];
        annotTrack = ideo.config.annotationTracks[annot.trackIndex];
        color = annotTrack.color;
        shape = annotTrack.shape;
      } else {
        annot.trackIndex = 0;
      }

      if ('color' in annot) {
        color = annot.color;
      }

      if ('shape' in annot) {
        shape = annot.shape;
      }

      annot.chr = chr;
      annot.chrIndex = i;
      annot.px = px;
      annot.startPx = startPx;
      annot.stopPx = stopPx;
      annot.color = color;
      annot.shape = shape;

      annots[m].annots.push(annot);
    }
  }

  return annots;
}

/**
 * Initializes various annotation settings.  Constructor help function.
 */
function initAnnotSettings() {
  if (
    this.config.annotationsPath ||
    this.config.localAnnotationsPath ||
    this.annots || this.config.annotations
  ) {
    if (!this.config.annotationHeight) {
      var annotHeight = Math.round(this.config.chrHeight / 100);
      this.config.annotationHeight = annotHeight;
    }

    if (this.config.annotationTracks) {
      this.config.numAnnotTracks = this.config.annotationTracks.length;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight =
      this.config.annotationHeight * this.config.numAnnotTracks;

    if (typeof this.config.barWidth === 'undefined') {
      this.config.barWidth = 3;
    }
  } else {
    this.config.annotTracksHeight = 0;
  }

  if (typeof this.config.annotationsColor === 'undefined') {
    this.config.annotationsColor = '#F00';
  }

  if (this.config.showAnnotTooltip !== false) {
    this.config.showAnnotTooltip = true;
  }

  if (this.config.onWillShowAnnotTooltip) {
    this.onWillShowAnnotTooltipCallback = this.config.onWillShowAnnotTooltip;
  }
}

/**
 * Requests annotations URL via HTTP, sets ideo.rawAnnots for downstream
 * processing.
 *
 * @param annotsUrl Absolute or relative URL native or BED annotations file
 */
function fetchAnnots(annotsUrl) {

  var ideo = this,
    tmp, extension;

  function afterRawAnnots(rawAnnots) {
    if (ideo.config.heatmaps) {
      ideo.deserializeAnnotsForHeatmap(rawAnnots);
    }
    if (ideo.onLoadAnnotsCallback) {
      ideo.onLoadAnnotsCallback();
    }
  }

  if (annotsUrl.slice(0, 4) !== 'http') {
    d3.json(ideo.config.annotationsPath)
      .then(function(data) {
        ideo.rawAnnots = data;
        afterRawAnnots(ideo.rawAnnots);
      });
    return;
  }

  tmp = annotsUrl.split('?')[0].split('.');
  extension = tmp[tmp.length - 1];

  if (extension !== 'bed' && extension !== 'json') {
    extension = extension.toUpperCase();
    alert(
      'This Ideogram.js only supports BED and Ideogram JSON at the ' +
      'moment.  Sorry, check back soon for ' + extension + ' support!'
    );
    return;
  }

  d3.text(annotsUrl).then(function(text) {
    if (extension === 'bed') {
      ideo.rawAnnots = new BedParser(text, ideo).rawAnnots;
    } else {
      ideo.rawAnnots = JSON.parse(text);
    }
    afterRawAnnots(ideo.rawAnnots);
  });

}

/**
 * Draws annotations defined by user
 */
function drawAnnots(friendlyAnnots) {
  var ideo = this,
    i, j, annot,
    rawAnnots = [],
    rawAnnot, keys,
    chr,
    chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  // Occurs when filtering
  if ('annots' in friendlyAnnots[0]) {
    return ideo.drawProcessedAnnots(friendlyAnnots);
  }

  for (chr in chrs) {
    rawAnnots.push({chr: chr, annots: []});
  }

  for (i = 0; i < friendlyAnnots.length; i++) {
    annot = friendlyAnnots[i];

    for (j = 0; j < rawAnnots.length; j++) {
      if (annot.chr === rawAnnots[j].chr) {
        rawAnnot = [
          annot.name,
          annot.start,
          annot.stop - annot.start
        ];
        if ('color' in annot) {
          rawAnnot.push(annot.color);
        }
        if ('shape' in annot) {
          rawAnnot.push(annot.shape);
        }
        rawAnnots[j].annots.push(rawAnnot);
        break;
      }
    }
  }

  keys = ['name', 'start', 'length'];
  if ('color' in friendlyAnnots[0]) {
    keys.push('color');
  }
  if ('shape' in friendlyAnnots[0]) {
    keys.push('shape');
  }
  ideo.rawAnnots = {keys: keys, annots: rawAnnots};

  ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

  ideo.drawProcessedAnnots(ideo.annots);
}

/**
 * Fills out annotations data structure such that its top-level list of arrays
 * matches that of this ideogram's chromosomes list in order and number
 * Fixes https://github.com/eweitz/ideogram/issues/66
 */
function fillAnnots(annots) {
  var filledAnnots, chrs, chrArray, i, chr, annot, chrIndex;

  filledAnnots = [];
  chrs = [];
  chrArray = this.chromosomesArray;

  for (i = 0; i < chrArray.length; i++) {
    chr = chrArray[i].name;
    chrs.push(chr);
    filledAnnots.push({chr: chr, annots: []});
  }

  for (i = 0; i < annots.length; i++) {
    annot = annots[i];
    chrIndex = chrs.indexOf(annot.chr);
    if (chrIndex !== -1) {
      filledAnnots[chrIndex] = annot;
    }
  }

  return filledAnnots;
}

/**
 * Draws genome annotations on chromosomes.
 * Annotations can be rendered as either overlaid directly
 * on a chromosome, or along one or more "tracks"
 * running parallel to each chromosome.
 */
function drawProcessedAnnots(annots) {
  var chrWidth, layout, annotHeight, triangle, circle, rectangle, r,
    chrAnnot, i, numAnnots, x1, x2, y1, y2, filledAnnots,
    ideo = this;

  chrWidth = this.config.chrWidth;

  layout = 'tracks';
  if (this.config.annotationsLayout) {
    layout = this.config.annotationsLayout;
  }

  if (layout === 'histogram') {
    annots = ideo.getHistogramBars(annots);
  }

  if (layout === 'heatmap') {
    ideo.drawHeatmaps(annots);
    return;
  }

  if (
    layout !== 'heatmap' && layout !== 'histogram'
  ) {
    numAnnots = 0;
    for (i = 0; i < annots.length; i++) {
      numAnnots += annots[i].annots.length;
    }
    if (numAnnots > 2000) {
      console.warn(
        'Rendering more than 2000 annotations in Ideogram?\n' +
        'Try setting "annotationsLayout" to "heatmap" or "histogram" in your ' +
        'Ideogram configuration object for better layout and performance.'
      );
    }
  }

  annotHeight = ideo.config.annotationHeight;

  triangle =
    'm0,0 l -' + annotHeight + ' ' +
    (2 * annotHeight) +
    ' l ' + (2 * annotHeight) + ' 0 z';

  // From http://stackoverflow.com/a/10477334, with a minor change ("m -r, r")
  // Circles are supported natively via <circle>, but having it as a path
  // simplifies handling triangles, circles and other shapes in the same
  // D3 call
  r = annotHeight;
  circle =
    'm -' + r + ', ' + r +
    'a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0' +
    'a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';

  rectangle =
    'm0,0 l 0 ' + (2 * annotHeight) +
    'l ' + annotHeight + ' 0' +
    'l 0 -' + (2 * annotHeight) + 'z';

  filledAnnots = ideo.fillAnnots(annots);

  chrAnnot = d3.selectAll(ideo.selector + ' .chromosome')
    .data(filledAnnots)
    .selectAll('path.annot')
    .data(function(d) {
      return d.annots;
    })
    .enter();

  if (layout === 'tracks') {
    chrAnnot
      .append('g')
      .attr('id', function(d) {
        return d.id;
      })
      .attr('class', 'annot')
      .attr('transform', function(d) {
        var y = ideo.config.chrWidth + (d.trackIndex * annotHeight * 2);
        return 'translate(' + d.px + ',' + y + ')';
      })
      .append('path')
      .attr('d', function(d) {
        if (!d.shape || d.shape === 'triangle') {
          return triangle;
        } else if (d.shape === 'circle') {
          return circle;
        } else if (d.shape === 'rectangle') {
          return rectangle;
        } else {
          return d.shape;
        }
      })
      .attr('fill', function(d) {
        return d.color;
      })
      .on('mouseover', function(d) { ideo.showAnnotTooltip(d, this); })
      .on('mouseout', function() { ideo.startHideAnnotTooltipTimeout(); });

  } else if (layout === 'overlay') {
    // Overlaid annotations appear directly on chromosomes

    chrAnnot.append('polygon')
      .attr('id', function(d) {
        return d.id;
      })
      .attr('class', 'annot')
      .attr('points', function(d) {
        if (d.stopPx - d.startPx > 1) {
          x1 = d.startPx;
          x2 = d.stopPx;
        } else {
          x1 = d.px - 0.5;
          x2 = d.px + 0.5;
        }
        y1 = chrWidth;
        y2 = 0;

        return (
          x1 + ',' + y1 + ' ' +
          x2 + ',' + y1 + ' ' +
          x2 + ',' + y2 + ' ' +
          x1 + ',' + y2
        );
      })
      .attr('fill', function(d) {
        return d.color;
      })
      .on('mouseover', function(d) { ideo.showAnnotTooltip(d, this); })
      .on('mouseout', function() { ideo.startHideAnnotTooltipTimeout(); });
  } else if (layout === 'histogram') {
    chrAnnot.append('polygon')
    // .attr('id', function(d, i) { return d.id; })
      .attr('class', 'annot')
      .attr('points', function(d) {
        x1 = d.px + ideo.bump;
        x2 = d.px + ideo.config.barWidth + ideo.bump;
        y1 = chrWidth;
        y2 = chrWidth + d.height;

        var thisChrWidth = ideo.chromosomesArray[d.chrIndex - 1].width;

        if (x2 > thisChrWidth) {
          x2 = thisChrWidth;
        }

        return (
          x1 + ',' + y1 + ' ' +
          x2 + ',' + y1 + ' ' +
          x2 + ',' + y2 + ' ' +
          x1 + ',' + y2
        );
      })
      .attr('fill', function(d) {
        return d.color;
      });
  }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
}

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

export {
  onLoadAnnots, onDrawAnnots, processAnnotData, initAnnotSettings,
  fetchAnnots, drawAnnots, getHistogramBars, drawHeatmaps,
  deserializeAnnotsForHeatmap, fillAnnots, drawProcessedAnnots, drawSynteny,
  startHideAnnotTooltipTimeout, showAnnotTooltip, onWillShowAnnotTooltip
}
