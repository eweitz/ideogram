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

import {organismMetadata} from './init/organism-metadata';

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

function getDir(dir) {
  var script, tmp, protocol, dataDir, ideogramInLeaf,
    scripts = document.scripts,
    version = Ideogram.version;

  if (location.pathname.includes('/examples/vanilla/') === false) {
    return (
      `https://cdn.jsdelivr.net/npm/ideogram@${version}/dist/data/${dir}`
    );
  }

  for (var i = 0; i < scripts.length; i++) {
    script = scripts[i];
    ideogramInLeaf = /ideogram/.test(script.src.split('/').slice(-1));
    if ('src' in script && ideogramInLeaf) {
      tmp = script.src.split('//');
      protocol = tmp[0];
      tmp = '/' + tmp[1].split('/').slice(0, -2).join('/');
      dataDir = protocol + '//' + tmp + '/data/' + dir;
      return dataDir;
    }
  }

  return '../data/' + dir;
}

/** Try request, and if failed then retry with URL lacking extension */
function fetchWithRetry(url, isRetry=false) {
  return fetch(url)
    .then((response) => {
      if (response.ok) {
        return response;
      } else {
        if (isRetry === false) {
          var urlWithoutExtension = url.replace('.json', '');
          return fetchWithRetry(urlWithoutExtension, true);
        } else {
          throw Error('Fetch failed for ' + url);
        }
      }
    });
}

/**
 * Returns directory used to fetch data for bands and annotations
 *
 * This simplifies ideogram configuration.  By default, the dataDir is
 * set to an external CDN unless we're serving from the local Ideogram
 * working directory
 *
 * @returns {String}
 */
function getDataDir() {
  return getDir('bands/native/');
}

/**
 * Rounds a float (e.g. SVG coordinate) to two decimal places
 *
 * @param coord Floating-point number, e.g. 42.1234567890
 * @returns {number} Rounded value, e.g. 42.12
 */
function round(coord) {
  // Per http://stackoverflow.com/a/9453447, below method is fastest
  return Math.round(coord * 100) / 100;
}

/**
 * Convert e.g. 1000 to 1 k, 1500000 to 1.5 M, etc.
 * Used to format 1500000 base pairs to e.g. 1.5 Mbp
 *
 * Adapted from https://stackoverflow.com/a/9462382/10564415
 */
function formatSiPrefix(num, digits) {
  const lookup = [
    {value: 1, symbol: ''},
    {value: 1e3, symbol: 'k'},
    {value: 1e6, symbol: 'M'},
    {value: 1e9, symbol: 'G'},
    {value: 1e12, symbol: 'T'},
    {value: 1e15, symbol: 'P'},
    {value: 1e18, symbol: 'E'}
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item) {
    return num >= item.value;
  });
  // eslint-disable-next-line max-len
  return item ? (num / item.value).toFixed(digits).replace(rx, '$1') + ' ' + item.symbol : '0';
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

/** Request data with Ideogram's authorization bearer token */
function fetchWithAuth(url, contentType) {
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

/** getTaxid(), but without need to initialize ideogram  */
function getEarlyTaxid(name) {
  name = slug(name);
  for (const taxid in organismMetadata) {
    const organism = organismMetadata[taxid];
    const commonName = slug(organism.commonName);
    const scientificName = slug(organism.scientificName);
    if (commonName === name || scientificName === name) {
      return taxid;
    }
  }

  return null;
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

/** Convert string to camelcase */
export function camel(str) {
  const camelCaseString = str
    .split(/[ _-]/g)
    .map((token, i) => {
      if (i > 0) {
        return token[0].toUpperCase() + token.slice(1);
      } else {
        return token;
      }
    })
    .join('');

  return camelCaseString;
}

/**
* Examples:
* "Homo sapiens" -> "homo-sapiens"
* "Canis lupus familiaris" -> "canis-lupus-familiaris"
*/
function slug(value) {
  if (typeof value === 'undefined') return '';
  return value.toLowerCase().replace(/ /g, '-');
}

// Determine if a string is a Roman numeral
// From https://stackoverflow.com/a/48601418
function isRoman(s) {
  // http://stackoverflow.com/a/267405/1447675
  return /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(s);
}

// Convert Roman numeral to integer
// From https://stackoverflow.com/a/48601418
function parseRoman(s) {
  var val = {M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1};
  return s.toUpperCase().split('').reduce(function(r, a, i, aa) {
    return val[a] < val[aa[i + 1]] ? r - val[a] : r + val[a];
  }, 0);
}

/**
* Download a PNG image of the ideogram
*
* Includes any annotations, but not legend.
*/
function downloadPng(ideo) {
  var ideoSvg = document.querySelector(ideo.selector);

  // Create a hidden canvas.  This will contain the raster image to download.
  var canvas = document.createElement('canvas');
  var canvasId = '_ideo-undisplayed-dl-canvas';
  canvas.setAttribute('style', 'display: none');
  canvas.setAttribute('id', canvasId);
  var width = ideoSvg.width.baseVal.value + 30;
  var ideoSvgClone = ideoSvg.cloneNode(true);
  ideoSvgClone.style.left = '';
  canvas.setAttribute('width', width);
  document.body.appendChild(canvas);

  // Called after PNG image is created from data URL
  function triggerDownload(imgUrl) {
    var evt = new MouseEvent('click', {
      view: window,
      bubbles: false,
      cancelable: true
    });

    var a = document.createElement('a');
    a.setAttribute('download', 'ideogram.png');
    a.setAttribute('href', imgUrl);
    a.setAttribute('target', '_blank');

    // Enables easy testing
    a.setAttribute('id', '_ideo-undisplayed-dl-image-link');
    a.setAttribute('style', 'display: none;');
    document.body.appendChild(a);

    a.dispatchEvent(evt);
    canvas.remove();
  }

  var canvas = document.getElementById(canvasId);

  // Enlarge canvas and disable smoothing, for higher resolution PNG
  canvas.width *= 2;
  canvas.height *= 2;
  var ctx = canvas.getContext('2d');
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;

  var data = (new XMLSerializer()).serializeToString(ideoSvgClone);
  var domUrl = window.URL || window.webkitURL || window;

  var img = new Image();
  var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
  var url = domUrl.createObjectURL(svgBlob);

  img.onload = function() {
    ctx.drawImage(img, 0, 0);
    domUrl.revokeObjectURL(url);

    var imgUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    triggerDownload(imgUrl);
  };

  img.src = url;
}


function getFont(ideo) {
  const config = ideo.config;

  let family = 'sans-serif';
  if (config.fontFamily) {
    family = config.fontFamily;
  }

  const labelSize = config.annotLabelSize ? config.annotLabelSize : 13;
  const font = '600 ' + labelSize + 'px ' + family;

  return font;
}

/**
 * Get width and height of given text in pixels.
 *
 * Background: https://erikonarheim.com/posts/canvas-text-metrics/
 */
function getTextSize(text, ideo) {
  var font = getFont(ideo);

  // re-use canvas object for better performance
  var canvas =
    getTextSize.canvas ||
    (getTextSize.canvas = document.createElement('canvas'));
  var context = canvas.getContext('2d');
  context.font = font;
  var metrics = context.measureText(text);

  // metrics.width is less precise than technique below
  var right = metrics.actualBoundingBoxRight;
  var left = metrics.actualBoundingBoxLeft;
  var width = Math.abs(left) + Math.abs(right);

  const height =
    Math.abs(metrics.actualBoundingBoxAscent) +
    Math.abs(metrics.actualBoundingBoxDescent);

  return {width, height};
}

/** Clone a nested array */
function deepCopy(array) {
  return JSON.parse(JSON.stringify(array));
}

export {
  assemblyIsAccession, hasNonGenBankAssembly, hasGenBankAssembly, getDataDir,
  getDir, round, formatSiPrefix, onDidRotate, getSvg, d3, getEarlyTaxid,
  getTaxid, getCommonName, getScientificName, slug, isRoman, parseRoman,
  downloadPng, fetchWithRetry, getTextSize, getFont, deepCopy,
  fetchWithAuth as fetch
};
