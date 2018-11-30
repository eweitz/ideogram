import * as d3selection from 'd3-selection';

import {writeHistogramAnnots} from './histogram';
import { writeLegend } from './legend'

var d3 = Object.assign({}, d3selection);

function parseFriendlyAnnots(friendlyAnnots, rawAnnots) {
  var i, j, annot, rawAnnot;

  for (i = 0; i < friendlyAnnots.length; i++) {
    annot = friendlyAnnots[i];

    for (j = 0; j < rawAnnots.length; j++) {
      if (annot.chr === rawAnnots[j].chr) {
        rawAnnot = [
          annot.name,
          annot.start,
          annot.stop - annot.start
        ];
        if ('color' in annot) rawAnnot.push(annot.color);
        if ('shape' in annot) rawAnnot.push(annot.shape);
        rawAnnots[j].annots.push(rawAnnot);
        break;
      }
    }
  }

  return rawAnnots;
}

function parseFriendlyKeys(friendlyAnnots) {
  var keys = ['name', 'start', 'length'];
  if ('color' in friendlyAnnots[0]) {
    keys.push('color');
  }
  if ('shape' in friendlyAnnots[0]) {
    keys.push('shape');
  }
  return keys;
}

/**
 * Draws annotations defined by user
 */
function drawAnnots(friendlyAnnots) {
  var keys, chr,
    rawAnnots = [],
    ideo = this,
    chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  // Occurs when filtering
  if ('annots' in friendlyAnnots[0]) {
    return ideo.drawProcessedAnnots(friendlyAnnots);
  }

  for (chr in chrs) {
    rawAnnots.push({chr: chr, annots: []});
  }
  rawAnnots = parseFriendlyAnnots(friendlyAnnots, rawAnnots)

  keys = parseFriendlyKeys(friendlyAnnots);

  ideo.rawAnnots = {keys: keys, annots: rawAnnots};
  ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

  ideo.drawProcessedAnnots(ideo.annots);
}

function getShapes(annotHeight) {
  var triangle, circle, rectangle, r;

  triangle =
    'm0,0 l -' + annotHeight + ' ' + (2 * annotHeight) +
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

  return {triangle: triangle, circle: circle, rectangle: rectangle};
}

function getChrAnnotNodes(filledAnnots, ideo) {
  return d3.selectAll(ideo.selector + ' .chromosome')
    .data(filledAnnots)
    .selectAll('path.annot')
    .data(function(d) {
      return d.annots;
    })
    .enter();
}

function determineShape(d, shapes) {
  if (!d.shape || d.shape === 'triangle') {
    return shapes.triangle;
  } else if (d.shape === 'circle') {
    return shapes.circle;
  } else if (d.shape === 'rectangle') {
    return shapes.rectangle;
  } else {
    return d.shape;
  }
}

function writeTrackAnnots(chrAnnot, ideo) {
  var shapes,
    annotHeight = ideo.config.annotationHeight;

  shapes = getShapes(annotHeight);

  chrAnnot.append('g')
    .attr('id', function(d) { return d.id; })
    .attr('class', 'annot')
    .attr('transform', function(d) {
      var y = ideo.config.chrWidth + (d.trackIndex * annotHeight * 2);
      return 'translate(' + d.px + ',' + y + ')';
    })
    .append('path')
    .attr('d', function(d) { return determineShape(d, shapes); })
    .attr('fill', function(d) { return d.color; })
    .on('mouseover', function(d) { ideo.showAnnotTooltip(d, this); })
    .on('mouseout', function() { ideo.startHideAnnotTooltipTimeout(); });
}

/**
 * Overlaid annotations appear directly on chromosomes
 */
function writeOverlayAnnots(chrAnnot, ideo) {
  chrAnnot.append('polygon')
    .attr('id', function(d) { return d.id; })
    .attr('class', 'annot')
    .attr('points', function(d) {
      var x1, x2,
        chrWidth = ideo.config.chrWidth;

      if (d.stopPx - d.startPx > 1) {
        x1 = d.startPx;
        x2 = d.stopPx;
      } else {
        x1 = d.px - 0.5;
        x2 = d.px + 0.5;
      }

      return (
        x1 + ',' + chrWidth + ' ' + x2 + ',' + chrWidth + ' ' +
        x2 + ',0 ' + x1 + ',0'
      );
    })
    .attr('fill', function(d) { return d.color; })
    .on('mouseover', function(d) { ideo.showAnnotTooltip(d, this); })
    .on('mouseout', function() { ideo.startHideAnnotTooltipTimeout(); });
}

function warnIfTooManyAnnots(layout, annots) {
  var i, numAnnots;

  if (layout !== 'heatmap' && layout !== 'histogram') {
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
}

function drawAnnotsByLayoutType(layout, annots, ideo) {
  var filledAnnots, chrAnnot;

  warnIfTooManyAnnots(layout, annots);

  if (layout === 'histogram') annots = ideo.getHistogramBars(annots);

  filledAnnots = ideo.fillAnnots(annots);

  chrAnnot = getChrAnnotNodes(filledAnnots, ideo);

  if (layout === 'tracks') {
    writeTrackAnnots(chrAnnot, ideo);
  } else if (layout === 'overlay') {
    writeOverlayAnnots(chrAnnot, ideo);
  } else if (layout === 'histogram') {
    writeHistogramAnnots(chrAnnot, ideo);
  }
}

/**
 * Draws genome annotations on chromosomes.
 * Annotations can be rendered as either overlaid directly
 * on a chromosome, or along one or more "tracks"
 * running parallel to each chromosome.
 */
function drawProcessedAnnots(annots) {
  var layout,
    ideo = this;

  d3.selectAll(ideo.selector + ' .annot').remove();

  layout = 'tracks';
  if (ideo.config.annotationsLayout) layout = ideo.config.annotationsLayout;

  if ('legend' in ideo.config) writeLegend(ideo);

  if (layout === 'heatmap') {
    ideo.drawHeatmaps(annots);
    return;
  }

  drawAnnotsByLayoutType(layout, annots, ideo);
  if (ideo.onDrawAnnotsCallback) ideo.onDrawAnnotsCallback();
}

export {drawAnnots, drawProcessedAnnots}