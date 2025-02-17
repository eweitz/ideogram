import {d3} from '../lib';
import {writeHistogramAnnots} from './histogram';
import {writeLegend} from './legend';


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
        if ('placement' in annot) rawAnnot.push(annot.placement);
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
  if ('placement'in friendlyAnnots[0]) {
    keys.push('placement');
  }
  return keys;
}

/**
 * Draws annotations defined by user
 */
function drawAnnots(friendlyAnnots, layout, keep=false, isOtherLayout=false) {
  var keys, chr,
    rawAnnots = [],
    ideo = this,
    chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  if (friendlyAnnots.length === 0) {
    ideo.annots = [];
    return;
  }

  if (
    'annots' in friendlyAnnots[0] || // When filtering
    'values' in friendlyAnnots[0] // When drawing cached expression matrices
  ) {
    return ideo.drawProcessedAnnots(friendlyAnnots, layout);
  }

  for (chr in chrs) {
    rawAnnots.push({chr: chr, annots: []});
  }
  rawAnnots = parseFriendlyAnnots(friendlyAnnots, rawAnnots);
  keys = parseFriendlyKeys(friendlyAnnots);

  ideo.rawAnnots = {keys: keys, annots: rawAnnots};

  const processedAnnots = ideo.processAnnotData(ideo.rawAnnots);
  if (!isOtherLayout) {
    ideo.annots = processedAnnots;
  } else {
    ideo.annotsOther = processedAnnots;
  }

  ideo.drawProcessedAnnots(processedAnnots, layout, keep);
}

function getShapes(annotHeight) {
  var reverseTriangle, triangle, circle, rectangle, r, span, histo;

  reverseTriangle =
    'm0,0 l -' + annotHeight + ' ' + (-2 * annotHeight) +
    ' l ' + (2 * annotHeight) + ' 0 z';

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

  span = ` `;

  histo = ` `;

  return {reverseTriangle: reverseTriangle, triangle: triangle, circle: circle,
    rectangle: rectangle, span: span, histo: histo};
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
    if (d.placement < 0) {
      return shapes.reverseTriangle;
    }
    return shapes.triangle;
  } else if (d.shape === 'circle') {
    return shapes.circle;
  } else if (d.shape === 'rectangle') {
    return shapes.rectangle;
  } else if (d.shape === 'span') {
    return shapes.span;
  } else if (d.shape === 'histo') {
    return shapes.histo;
  } else {
    return d.shape;
  }
}

/**
 * Multiple annotations appear next to chromosomes
 */
function writeTrackAnnots(chrAnnot, ideo) {
  var shapes,
    annotHeight = ideo.config.annotationHeight;
  shapes = getShapes(annotHeight);

  var gElement = chrAnnot.append('g')
    .attr('id', function(d) {return d.domId;})
    .attr('class', 'annot')
    .attr('transform', function(d) {
      if (d.shape !== 'span' && d.shape !== 'histo') {
        var y = ideo.config.chrWidth + (d.placement * annotHeight * 2);
        if (d.placement < 0) {
          var y = ((d.placement + 1) * annotHeight * 2);
        }
        return 'translate(' + d.px + ',' + y + ')';
      }
    })
    .attr('fill', function(d) {return d.color;});

  gElement
    .filter(function(d) {
      return d.shape === 'span' || d.shape == 'histo';
    })
    .on('mouseover', function(event, d) {ideo.showAnnotTooltip(d, this);})
    .on('mouseout', function() {ideo.startHideAnnotTooltipTimeout();})
    .on('click', function(event, d) {ideo.onClickAnnot(d);})
    .append('polygon')
    .attr('points', function(d) {
      var x1 = d.startPx;
      var x2 = d.stopPx;
      var annotHeight = ideo.config.annotationHeight * 2;
      var y = ideo.config.chrWidth + (d.placement * annotHeight);
      if (d.shape === 'span') {
        if (d.placement < 0) {
          var y = annotHeight + ((d.placement - 1) * annotHeight);
        }

        var points = [
          `${x1},${y + annotHeight}`,
          `${x2},${y + annotHeight}`,
          `${x2},${y}`,
          `${x1},${y}`
        ];
        const bars = points.join(' ');
        return bars;
      }
      if (d.shape === 'histo') {
        if (d.placement >= 0) {
          var points = [
            `${x1},${y}`,
            `${x2},${y}`,
            `${x2},${y + d.height}`,
            `${x1},${y + d.height}`
          ];
        } else if (d.placement < 0) {
          var y = ((d.placement + 1) * annotHeight);
          var points = [
            `${x1},${y - d.height}`,
            `${x2},${y - d.height}`,
            `${x2},${y}`,
            `${x1},${y}`
          ];
        }
        const bars = points.join(' ');
        return bars;
      }
    });

  gElement
    .filter(function(d) {
      return d.shape !== 'span' && d.shape !== 'histo';
    })
    .append('path')
    .attr('d', function(d) {return determineShape(d, shapes);})
    .on('mouseover', function(event, d) {ideo.showAnnotTooltip(d, this);})
    .on('mouseout', function() {ideo.startHideAnnotTooltipTimeout();})
    .on('click', function(event, d) {ideo.onClickAnnot(d);});
}

/**
 * Overlaid annotations appear directly on chromosomes
 */
function writeOverlayAnnots(chrAnnot, ideo) {
  chrAnnot.append('polygon')
    .attr('id', function(d) {return d.id;})
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
    .attr('fill', function(d) {return d.color;})
    .on('mouseover', function(event, d) {ideo.showAnnotTooltip(d, this);})
    .on('mouseout', function() {ideo.startHideAnnotTooltipTimeout();});
}

/**
 * Annotations appear next to chromosomes
 */
function writeSpanAnnots(chrAnnot, ideo) {
  chrAnnot.append('g')
    .attr('id', function(d) {return d.domId;})
    .attr('class', 'annot')
    .append('polygon')
    .attr('points', function(d) {
      var annotHeight = ideo.config.annotationHeight * 2;
      var x1 = d.startPx;
      var x2 = d.stopPx;
      var y = ideo.config.chrWidth + (d.placement * annotHeight);

      var points = [
        `${x1},${y + annotHeight}`,
        `${x2},${y + annotHeight}`,
        `${x2},${y}`,
        `${x1},${y}`
      ];
      const bars = points.join(' ');
      return bars;
    })
    .attr('fill', function(d) {return d.color;})
    .on('mouseover', function(event, d) {ideo.showAnnotTooltip(d, this);})
    .on('mouseout', function() {ideo.startHideAnnotTooltipTimeout();})
    .on('click', function(event, d) {ideo.onClickAnnot(d);});
};

function warnIfTooManyAnnots(layout, annots) {
  var i, numAnnots;

  if (!/heatmap/.test(layout) && layout !== 'histogram') {
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
  } else if (layout === 'span') {
    writeSpanAnnots(chrAnnot, ideo);
  }
}

/**
 * Draws genome annotations on chromosomes.
 * Annotations can be rendered as either overlaid directly
 * on a chromosome, or along one or more "tracks"
 * running parallel to each chromosome.
 */
function drawProcessedAnnots(annots, layout, keep=false) {

  var ideo = this;

  if (ideo.onBeforeDrawAnnotsCallback) {
    ideo.onBeforeDrawAnnotsCallback();
  }

  if (!keep) {
    d3.selectAll(ideo.selector + ' .annot').remove();
  }

  if (layout === undefined) layout = 'tracks';
  if (ideo.config.annotationsLayout) layout = ideo.config.annotationsLayout;

  if ('legend' in ideo.config) writeLegend(ideo);

  if (/heatmap/.test(layout)) {
    ideo.drawHeatmaps(annots);
    return;
  }

  drawAnnotsByLayoutType(layout, annots, ideo);
  if (ideo.onDrawAnnotsCallback) ideo.onDrawAnnotsCallback();
}

export {drawAnnots, drawProcessedAnnots, getShapes};
