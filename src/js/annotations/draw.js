import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

/**
 * Draws annotations defined by user
 */
function drawAnnots(friendlyAnnots) {
  var i, j, annot, rawAnnot, keys, chr,
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
 * Draws genome annotations on chromosomes.
 * Annotations can be rendered as either overlaid directly
 * on a chromosome, or along one or more "tracks"
 * running parallel to each chromosome.
 */
function drawProcessedAnnots(annots) {
  var chrWidth, layout, annotHeight, triangle, circle, rectangle, r,
    chrAnnot, i, numAnnots, x1, x2, y1, y2, filledAnnots,
    ideo = this;

  d3.selectAll('.annot').remove();

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

        var thisChrWidth = ideo.chromosomesArray[d.chrIndex].width;

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

export {drawAnnots, drawProcessedAnnots}