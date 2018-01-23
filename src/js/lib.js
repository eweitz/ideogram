/**
 * @fileoverview A collection of Ideogram methods that don't fit elsewhere.
 */

import * as d3selection from 'd3-selection';

import {ModelAdapter} from './model-adapter';
import {Chromosome} from './views/chromosome';

/**
 * Polyfill for Object.assign, to enable usage in IE 10.
 *
 * This is a lightly modified version of
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
 */
if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target === null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

var d3 = Object.assign({}, d3selection);

/**
 * Is the assembly in this.config an NCBI Assembly accession?
 *
 * @returns {boolean}
 */
function assemblyIsAccession() {
  return (
    'assembly' in this.config &&
    /(GCF_|GCA_)/.test(this.config.assembly)
  );
}

/**
 * Returns directory used to fetch data for bands and annotations
 *
 * This simplifies ideogram configuration.  By default, the dataDir is
 * set to an external CDN unless we're serving from the local host, in
 * which case dataDir is deduced from the "src" attribute of the ideogram
 * script loaded in the document.
 *
 * @returns {String}
 */
function getDataDir() {
  var scripts = document.scripts,
    host = location.host,
    version = Ideogram.version,
    script, tmp, protocol, dataDir;

  if (host !== 'localhost' && host !== '127.0.0.1') {
    return (
      'https://unpkg.com/ideogram@' + version + '/dist/data/bands/native/'
    );
  }

  for (var i = 0; i < scripts.length; i++) {
    script = scripts[i];
    if (
      'src' in script &&
      /ideogram/.test(script.src.split('/').slice(-1))
    ) {
      tmp = script.src.split('//');
      protocol = tmp[0];
      tmp = '/' + tmp[1].split('/').slice(0,-2).join('/');
      dataDir = protocol + '//' + tmp + '/data/bands/native/';
      return dataDir;
    }
  }
  return '../data/bands/native/';
}

function getChromosomePixels(chr) {

  var bands, chrHeight, pxStop, hasBands, maxLength, band, cs, csLength,
    width, chrLength;

  bands = chr.bands;
  chrHeight = this.config.chrHeight;
  pxStop = 0;
  cs = this.coordinateSystem;
  hasBands = (typeof bands !== 'undefined');
  maxLength = this.maxLength;
  chrLength = chr.length;

  if (hasBands) {
    for (var i = 0; i < bands.length; i++) {
      band = bands[i];
      csLength = band[cs].stop - band[cs].start;

      // If ideogram is rotated (and thus showing only one chromosome),
      // then set its width independent of the longest chromosome in this
      // genome.
      if (this._layout._isRotated) {
        width = chrHeight * csLength / chrLength;
      } else {
        width = chrHeight * chr.length / maxLength[cs] * csLength / chrLength;
      }

      bands[i].px = {
        start: pxStop,
        stop: pxStop + width,
        width: width
      };

      pxStop = bands[i].px.stop;

      if (hasBands && band.stain === 'acen' && band.name[0] === 'p') {
        chr.pcenIndex = i;
      }
    }
  } else {
    pxStop = chrHeight * chr.length / maxLength[cs];
  }

  chr.width = pxStop;

  chr.scale = {};

  // TODO:
  //
  // A chromosome-level scale property is likely
  // nonsensical for any chromosomes that have cytogenetic band data.
  // Different bands tend to have ratios between number of base pairs
  // and physical length.
  //
  // However, a chromosome-level scale property is likely
  // necessary for chromosomes that do not have band data.
  //
  // This needs further review.
  if (this.config.multiorganism === true) {
    chr.scale.bp = 1;
    // chr.scale.bp = band.iscn.stop / band.bp.stop;
    chr.scale.iscn = chrHeight * chrLength / maxLength.bp;
  } else {
    chr.scale.bp = chrHeight / maxLength.bp;
    if (hasBands) {
      chr.scale.iscn = chrHeight / maxLength.iscn;
    }
  }
  chr.bands = bands;

  return chr;
}

/**
 * Generates a model object for each chromosome containing information on
 * its name, DOM ID, length in base pairs or ISCN coordinates, cytogenetic
 * bands, centromere position, etc.
 */
function getChromosomeModel(bands, chromosome, taxid, chrIndex) {
  var chr = {},
    cs, hasBands;

  cs = this.coordinateSystem;
  hasBands = (typeof bands !== 'undefined');

  if (hasBands) {
    chr.name = chromosome;
    chr.length = bands[bands.length - 1][cs].stop;
    chr.type = 'nuclear';
  } else {
    chr = chromosome;
  }

  chr.chrIndex = chrIndex;

  chr.id = 'chr' + chr.name + '-' + taxid;

  if (this.config.fullChromosomeLabels === true) {
    var orgName = this.organisms[taxid].scientificNameAbbr;
    chr.name = orgName + ' chr' + chr.name;
  }

  chr.bands = bands;
  chr = this.getChromosomePixels(chr);

  chr.centromerePosition = '';
  if (
    hasBands && bands[0].name[0] === 'p' && bands[1].name[0] === 'q' &&
    bands[0].bp.stop - bands[0].bp.start < 2E6
  ) {
    // As with almost all mouse chromosome, chimpanzee chr22
    chr.centromerePosition = 'telocentric';

    // Remove placeholder pter band
    chr.bands = chr.bands.slice(1);
  }

  if (hasBands && chr.bands.length === 1) {
    // Encountered when processing an assembly that has chromosomes with
    // centromere data, but this chromosome does not.
    // Example: chromosome F1 in Felis catus.
    delete chr.bands;
  }

  return chr;
}

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

  // Append chromosomes set's labels
  d3.selectAll(ideo.selector + ' .chromosome-set-container')
    .append('text')
    .data(ideo.chromosomesArray)
    .attr('class', 'chromosome-set-label ' + chromosomeLabelClass)
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
        }).text(String);
    });

  var setLabelTranslate = ideo._layout.getChromosomeSetLabelTranslate();

  // Append chromosomes labels
  d3.selectAll(ideo.selector + ' .chromosome-set-container')
    .each(function(a, chrSetNumber) {
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
        .text(function(d, chrNumber) {
          return ideo._ploidy.getAncestor(chrSetNumber, chrNumber);
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


/**
 * Rounds an SVG coordinates to two decimal places
 *
 * @param coord SVG coordinate, e.g. 42.1234567890
 * @returns {number} Rounded value, e.g. 42.12
 */
function round(coord) {
  // Per http://stackoverflow.com/a/9453447, below method is fastest
  return Math.round(coord * 100) / 100;
}

/**
 * Adds a copy of a chromosome (i.e. a homologous chromosome, homolog) to DOM
 *
 * @param chrModel
 * @param chrIndex
 * @param homologIndex
 * @param container
 */
function appendHomolog(chrModel, chrIndex, homologIndex, container) {

  var homologOffset, chromosome, shape, defs, adapter;

  defs = d3.select(this.selector + ' defs');
  // Get chromosome model adapter class
  adapter = ModelAdapter.getInstance(chrModel);

  // How far this copy of the chromosome is from another
  homologOffset = homologIndex * this.config.chrMargin;

  // Append chromosome's container
  chromosome = container
    .append('g')
    .attr('id', chrModel.id)
    .attr('class', 'chromosome ' + adapter.getCssClass())
    .attr('transform', 'translate(0, ' + homologOffset + ')');


  if (chrModel.name === '21') {
    console.log("chrModel.bands[0].px");
    console.log(chrModel.bands[0].px);
  }


  if (chrModel.name === '21') {
    console.log("adapter._model.bands[0].px");
    console.log(adapter._model.bands[0].px);
  }

  // Render chromosome
  shape = Chromosome.getInstance(adapter, this.config, this)
    .render(chromosome, chrIndex, homologIndex);

  if (chrModel.name === '21') {
    console.log('shape');
    console.log(shape);
  }

  d3.select('#' + chrModel.id + '-chromosome-set-clippath').remove();

  defs.append('clipPath')
    .attr('id', chrModel.id + '-chromosome-set-clippath')
    .selectAll('path')
    .data(shape)
    .enter()
    .append('path')
    .attr('d', function (d) {
      return d.path;
    })
    .attr('class', function (d) {
      return d.class;
    });
}

/**
 * Renders all the bands and outlining boundaries of a chromosome.
 */
function drawChromosome(chrName) {

  var chrModel, chrIndex, container, numChrsInSet, transform, chrSetNumber;

  chrModel = this.chromosomes[this.config.taxid][chrName];
  chrIndex = chrModel.chrIndex;

  transform = this._layout.getChromosomeSetTranslate(chrIndex);

  container = d3.select('#' + chrModel.id + '-chromosome-set');

  if (container.nodes().length === 0) {
    // Append chromosome set container
    container = d3.select(this.selector)
      .append('g')
      .attr('class', 'chromosome-set-container')
      .attr('data-set-number', chrIndex)
      .attr('transform', transform)
      .attr('id', chrModel.id + '-chromosome-set');
  }

  if (
    'sex' in this.config &&
    this.config.ploidy === 2 &&
    this.sexChromosomes.index === chrIndex
  ) {
    this.drawSexChromosomes(container, chrIndex);
    return;
  }

  numChrsInSet = 1;
  if (this.config.ploidy > 1) {
    numChrsInSet = this._ploidy.getChromosomesNumber(chrIndex);
  }

  for (var homologIndex = 0; homologIndex < numChrsInSet; homologIndex++) {
    this.appendHomolog(chrModel, chrIndex, homologIndex, container);
  }
}

/**
 * Rotates a chromosome 90 degrees and shows or hides all other chromosomes
 * Useful for focusing or defocusing a particular chromosome
 */
function rotateAndToggleDisplay(chromosome) {
  // Do nothing if taxId not defined. But it should be defined.
  // To fix that bug we should have a way to find chromosome set number.
  if (!this.config.taxid) {
    return;
  }

  // TODO: Why not just use chrModel.chrIndex?
  var chrIndex = Array.prototype.slice.call(
    d3.select(chromosome.parentNode).selectAll('g.chromosome')._groups[0]
  ).indexOf(chromosome);

  var chrSetNumber =
    Number(d3.select(chromosome.parentNode).attr('data-set-number'));

  return this._layout.rotate(chrSetNumber, chrIndex, chromosome);
}

/**
 * Get ideogram SVG container
 */
function getSvg() {
  return d3.select(this.selector).node();
}

export {
  assemblyIsAccession, getDataDir, getChromosomeModel,
  getChromosomePixels, drawChromosomeLabels, rotateChromosomeLabels,
  round, appendHomolog, drawChromosome, rotateAndToggleDisplay, getSvg,
  Object
};

