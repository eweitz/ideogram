import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

/**
 * Draws labels for each chromosome, e.g. "1", "2", "X".
 * If ideogram configuration has 'fullChromosomeLabels: True',
 * then labels includes name of taxon, which can help when
 * depicting orthologs.
 */
function drawChromosomeLabels() {
  var ideo = this;

  var chromosomeLabelClass = ideo._layout.getChromosomeLabelClass();

  var chrSetLabelXPosition = ideo._layout.getChromosomeSetLabelXPosition();
  var chrSetLabelTranslate = ideo._layout.getChromosomeSetLabelTranslate();

  // Append chromosome set's labels
  d3.selectAll(ideo.selector + ' .chromosome-set-container')
    .insert('text', ':first-child')
    .data(ideo.chromosomesArray)
    .attr('class', chromosomeLabelClass)
    .attr('transform', chrSetLabelTranslate)
    .attr('x', chrSetLabelXPosition)
    .attr('y', function(d, i) {
      return ideo._layout.getChromosomeSetLabelYPosition(i);
    })
    .attr('text-anchor', ideo._layout.getChromosomeSetLabelAnchor())
    .each(function(d, i) {
      // Get label lines
      var lines;
      if (d.name.indexOf(' ') === -1) {
        lines = [d.name];
      } else {
        lines = d.name.match(/^(.*)\s+([^\s]+)$/).slice(1).reverse();
      }

      if (
        'sex' in ideo.config &&
        ideo.config.ploidy === 2 &&
        i === ideo.sexChromosomes.index
      ) {
        if (ideo.config.sex === 'male') {
          lines = ['XY'];
        } else {
          lines = ['XX'];
        }
      }

      // Render label lines
      d3.select(this).selectAll('tspan')
        .data(lines)
        .enter()
        .append('tspan')
        .attr('dy', function(d, i) {
          return i * -1.2 + 'em';
        })
        .attr('x', ideo._layout.getChromosomeSetLabelXPosition())
        .attr('class', function(a, i) {
          var fullLabels = ideo.config.fullChromosomeLabels;
          return i === 1 && fullLabels ? 'italic' : null;
        })
        .text(String);
    });

  var setLabelTranslate = ideo._layout.getChromosomeSetLabelTranslate();

  // Append chromosomes labels
  d3.selectAll(ideo.selector + ' .chromosome-set-container')
    .each(function(a, chrSetIndex) {
      d3.select(this).selectAll('.chromosome')
        .append('text')
        .attr('class', 'chrLabel')
        .attr('transform', setLabelTranslate)
        .attr('x', function(d, i) {
          return ideo._layout.getChromosomeLabelXPosition(i);
        })
        .attr('y', function(d, i) {
          return ideo._layout.getChromosomeLabelYPosition(i);
        })
        .text(function(d, chrIndex) {
          return ideo._ploidy.getAncestor(chrSetIndex, chrIndex);
        })
        .attr('text-anchor', 'middle');
    });
}

/**
 * Rotates chromosome labels by 90 degrees, e.g. upon clicking a chromosome to focus.
 */
function rotateChromosomeLabels(chr, chrIndex, orientation, scale) {
  var chrMargin, chrWidth, ideo, x, y,
    numAnnotTracks, scaleSvg, tracksHeight, chrMargin2;

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;
  numAnnotTracks = this.config.numAnnotTracks;

  ideo = this;

  if (
    typeof (scale) !== 'undefined' &&
    scale.hasOwnProperty('x') &&
    !(scale.x === 1 && scale.y === 1)
  ) {
    scaleSvg = 'scale(' + scale.x + ',' + scale.y + ')';
    x = -6;
    y = (scale === '' ? -16 : -14);
  } else {
    x = -8;
    y = -16;
    scale = {x: 1, y: 1};
    scaleSvg = '';
  }

  if (orientation === 'vertical' || orientation === '') {
    var ci = chrIndex - 1;

    if (numAnnotTracks > 1 || orientation === '') {
      ci -= 1;
    }

    chrMargin2 = -4;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + chrWidth + 26;
    }

    chrMargin = ideo.config.chrMargin * ci;

    if (numAnnotTracks > 1 === false) {
      chrMargin += 1;
    }

    y = chrMargin + chrMargin2;

    chr.selectAll('text.chrLabel')
      .attr('transform', scaleSvg)
      .selectAll('tspan')
      .attr('x', x)
      .attr('y', y);
  } else {
    chrIndex -= 1;

    chrMargin2 = -chrWidth - 2;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + 8;
    }

    tracksHeight = ideo.config.annotTracksHeight;
    if (ideo.config.annotationsLayout !== 'overlay') {
      tracksHeight *= 2;
    }

    chrMargin = ideo.config.chrMargin * chrIndex;
    x = -(chrMargin + chrMargin2) + 3 + tracksHeight;
    x /= scale.x;

    chr.selectAll('text.chrLabel')
      .attr('transform', 'rotate(-90)' + scaleSvg)
      .selectAll('tspan')
      .attr('x', x)
      .attr('y', y);
  }
}

export {drawChromosomeLabels, rotateChromosomeLabels}