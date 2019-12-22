/**
 * @fileoverview A collection of Ideogram methods that don't fit elsewhere.
 */

import {select, selectAll} from 'd3-selection';
import * as d3fetch from 'd3-fetch';
import * as d3brush from 'd3-brush';
import * as d3dispatch from 'd3-dispatch';
import * as d3format from 'd3-format';
import {scaleLinear} from 'd3-scale';
import {max} from 'd3-array';

var d3 = Object.assign(
  {}, d3fetch, d3brush, d3dispatch, d3format
);

d3.select = select;
d3.selectAll = selectAll;
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
      'https://cdn.jsdelivr.net/npm/ideogram@' + version + '/dist/data/bands/native/'
    );
  }

  for (var i = 0; i < scripts.length; i++) {
    script = scripts[i];
    ideogramInLeaf = /ideogram/.test(script.src.split('/').slice(-1));
    if ('src' in script && ideogramInLeaf) {
      tmp = script.src.split('//');
      protocol = tmp[0];
      tmp = '/' + tmp[1].split('/').slice(0, -2).join('/');
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

function fetch(url, contentType) {
  var ideo = this,
    config = ideo.config,
    headers = new Headers();

  if (config.accessToken) {
    headers = new Headers({Authorization: 'Bearer ' + config.accessToken});
  }

  if (contentType === 'text') {
    return d3.text(url, {headers: headers});
  } else {
    return d3.json(url, {headers: headers});
  }
}

/**
 * Get organism's taxid (NCBI Taxonomy ID) given its common or scientific name
 */
function getTaxid(name) {
  var organism, taxid, commonName, scientificName,
    ideo = this,
    organisms = ideo.organisms;

  name = slug(name);

  for (taxid in organisms) {
    organism = organisms[taxid];
    commonName = slug(organism.commonName);
    scientificName = slug(organism.scientificName);
    if (commonName === name || scientificName === name) {
      return taxid;
    }
  }

  return null;
}

/**
 * Get organism's common name given its taxid
 */
function getCommonName(taxid) {
  var ideo = this;
  if (taxid in ideo.organisms) {
    return ideo.organisms[taxid].commonName;
  }
  return null;
}

/**
 * Get organism's scientific name given its taxid
 */
function getScientificName(taxid) {
  var ideo = this;
  if (taxid in ideo.organisms) {
    return ideo.organisms[taxid].scientificName;
  }
  return null;
}

/**
* e.g. "Homo sapiens" -> "homo-sapiens"
*/
function slug(value) {
  return value.toLowerCase().replace(' ', '-');
}

export {
  assemblyIsAccession, hasNonGenBankAssembly, hasGenBankAssembly, getDataDir,
  round, onDidRotate, getSvg, fetch, d3, getTaxid, getCommonName,
  getScientificName, slug
};
