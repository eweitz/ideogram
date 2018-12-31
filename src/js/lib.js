/**
 * @fileoverview A collection of Ideogram methods that don't fit elsewhere.
 */

import * as d3selection from 'd3-selection';
import * as d3multiselection from 'd3-selection-multi';
import * as d3fetch from 'd3-fetch';
import * as d3brush from 'd3-brush';
import * as d3dispatch from 'd3-dispatch';
import {scaleLinear} from 'd3-scale';
import {max} from 'd3-array';

var d3 = Object.assign(
  {}, d3selection, d3multiselection, d3fetch, d3brush, d3dispatch
);

d3.scaleLinear = scaleLinear;
d3.max = max;

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
 * Is the assembly in this.config not from GenBank?
 *
 * @returns {boolean}
 */
function hasNonGenBankAssembly(ideo) {
  return (
    'assembly' in ideo.config &&
    /(GCA_)/.test(ideo.config.assembly) === false
  );
}

/**
 * Is the assembly in this.config from GenBank?
 *
 * @returns {boolean}
 */
function hasGenBankAssembly(ideo) {
  return (
    'assembly' in ideo.config &&
    /(GCA_)/.test(ideo.config.assembly)
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
  var script, tmp, protocol, dataDir, ideogramInLeaf,
    scripts = document.scripts,
    host = location.host.split(':')[0],
    version = Ideogram.version;

  if (host !== 'localhost' && host !== '127.0.0.1') {
    return (
      'https://unpkg.com/ideogram@' + version + '/dist/data/bands/native/'
    );
  }

  for (var i = 0; i < scripts.length; i++) {
    script = scripts[i];
    ideogramInLeaf = /ideogram/.test(script.src.split('/').slice(-1));
    if ('src' in script && ideogramInLeaf) {
      tmp = script.src.split('//');
      protocol = tmp[0];
      tmp = '/' + tmp[1].split('/').slice(0,-2).join('/');
      dataDir = protocol + '//' + tmp + '/data/bands/native/';
      return dataDir;
    }
  }
  return '../data/bands/native/';
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

function onDidRotate(chrModel) {
  call(this.onDidRotateCallback, chrModel);
}

/**
 * Get ideogram SVG container
 */
function getSvg() {
  return d3.select(this.selector).node();
}

export {
  assemblyIsAccession, hasNonGenBankAssembly, hasGenBankAssembly, getDataDir,
  drawChromosomeLabels, rotateChromosomeLabels, round, appendHomolog,
  drawChromosome, rotateAndToggleDisplay, onDidRotate, getSvg,
  setOverflowScroll, d3
};
