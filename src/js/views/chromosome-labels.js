import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

function getChrSetLabelLines(d, i, ideo) {
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

  return lines
}

function renderChromosomeSetLabel(d, i, textElement, ideo) {
  // Get label lines
  var lines = getChrSetLabelLines(d, i, ideo);

  // Render label lines
  d3.select(textElement).selectAll('tspan')
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
}

function appendChromosomeSetLabels(ideo) {
  var layout = ideo._layout;

  d3.selectAll(ideo.selector + ' .chromosome-set-container')
    .insert('text', ':first-child')
    .data(ideo.chromosomesArray)
    .attr('class', layout.getChromosomeLabelClass())
    .attr('transform', layout.getChromosomeSetLabelTranslate())
    .attr('x', layout.getChromosomeSetLabelXPosition())
    .attr('y', function(d, i) {
      return layout.getChromosomeSetLabelYPosition(i);
    })
    .attr('text-anchor', layout.getChromosomeSetLabelAnchor())
    .each(function(d, i) {
      renderChromosomeSetLabel(d, i, this, ideo);
    });
}

function appendChromosomeLabels(ideo) {
  var layout = ideo._layout;

  d3.selectAll(ideo.selector + ' .chromosome-set-container')
    .each(function(a, chrSetIndex) {
      d3.select(this).selectAll('.chromosome')
        .append('text')
        .attr('class', 'chrLabel')
        .attr('transform', layout.getChromosomeSetLabelTranslate())
        .attr('x', function(d, i) {
          return layout.getChromosomeLabelXPosition(i);
        })
        .attr('y', function(d, i) {
          return layout.getChromosomeLabelYPosition(i);
        })
        .text(function(d, chrIndex) {
          return ideo._ploidy.getAncestor(chrSetIndex, chrIndex);
        })
        .attr('text-anchor', 'middle');
    });
}

/**
 * Draws labels for each chromosome, e.g. "1", "2", "X".
 * If ideogram configuration has 'fullChromosomeLabels: True',
 * then labels includes name of taxon, which can help when
 * depicting orthologs.
 */
function drawChromosomeLabels() {
  var ideo = this;
  appendChromosomeSetLabels(ideo);
  appendChromosomeLabels(ideo);
}

function getLabelPositionAttrs(scale) {
  var x, y, scaleSvg, scale;

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

  return {x: x, y: y, scaleSvg: scaleSvg, scale: scale};
}

function updateChrIndex(chrIndex, config) {
  if (config.numAnnotTracks > 1 || config.orientation === '') chrIndex -= 1;
  return chrIndex
}

function rotateVerticalChromosomeLabels(chr, chrIndex, labelPosAttrs, ideo) {
  var chrMargin2, chrMargin, y,
    config = ideo.config;

  chrIndex = updateChrIndex(chrIndex, config);

  chrMargin2 = -4;
  if (config.showBandLabels === true) {
    chrMargin2 = config.chrMargin + config.chrWidth + 26;
  }

  chrMargin = config.chrMargin * chrIndex;
  if (config.numAnnotTracks > 1 === false) chrMargin += 1;

  y = chrMargin + chrMargin2;

  chr.selectAll('text.chrLabel')
    .attr('transform', labelPosAttrs.scaleSvg)
    .selectAll('tspan')
    .attr('x', labelPosAttrs.x)
    .attr('y', y);
}

function rotateHorizontalChromosomeLabels(chr, chrIndex, labelPosAttrs, ideo) {
  var chrMargin, chrMargin2, tracksHeight, x,
    config = ideo.config;

  chrMargin2 = -config.chrWidth - 2;
  if (config.showBandLabels === true) chrMargin2 = config.chrMargin + 8;

  tracksHeight = config.annotTracksHeight;
  if (config.annotationsLayout !== 'overlay') tracksHeight *= 2;

  chrMargin = config.chrMargin * chrIndex;
  x = -(chrMargin + chrMargin2) + 3 + tracksHeight;
  x /= labelPosAttrs.scale.x;

  chr.selectAll('text.chrLabel')
    .attr('transform', 'rotate(-90)' + labelPosAttrs.scaleSvg)
    .selectAll('tspan')
    .attr('x', x)
    .attr('y', labelPosAttrs.y);
}

/**
 * Rotates chromosome labels by 90 degrees, e.g. upon clicking a chromosome.
 */
function rotateChromosomeLabels(chr, chrIndex, orientation, scale) {
  var labelPosAttrs,
    ideo = this;

  chrIndex -= 1;

  labelPosAttrs = getLabelPositionAttrs(scale);

  if (orientation === 'vertical' || orientation === '') {
    rotateVerticalChromosomeLabels(chr, chrIndex, labelPosAttrs, ideo);
  } else {
    rotateHorizontalChromosomeLabels(chr, chrIndex, labelPosAttrs, ideo);
  }
}

export {drawChromosomeLabels, rotateChromosomeLabels}