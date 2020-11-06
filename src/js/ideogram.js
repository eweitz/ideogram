/**
 * @fileoverview Core module of Ideogram.js, links all other modules
 * This file defines the Ideogram class, its constructor method, and its
 * static methods.  All instance methods are defined in other modules.
 *
 */

import version from './version';

import {
  configure, initDrawChromosomes, handleRotateOnClick, onLoad,
  init, finishInit, writeContainer
} from './init/init';

import {
  onLoadAnnots, onDrawAnnots, processAnnotData, restoreDefaultTracks,
  updateDisplayedTracks, initAnnotSettings, fetchAnnots, drawAnnots,
  getHistogramBars, drawHeatmaps, deserializeAnnotsForHeatmap, fillAnnots,
  drawProcessedAnnots, drawSynteny, startHideAnnotTooltipTimeout,
  showAnnotTooltip, onWillShowAnnotTooltip, setOriginalTrackIndexes,
  afterRawAnnots, onClickAnnot, downloadAnnotations, addAnnotLabel,
  removeAnnotLabel, fillAnnotLabels, clearAnnotLabels
  // fadeOutAnnotLabels
} from './annotations/annotations';

import {highlight, unhighlight} from './annotations/highlight';

import {
  esearch, esummary, elink,
  getOrganismFromEutils, getTaxids,
  getAssemblyAndChromosomesFromEutils
} from './services/services';

import {
  drawBandLabels, getBandColorGradients, processBandData,
  setBandsToShow, hideUnshownBandLabels, drawBandLabelText, drawBandLabelStalk
} from './bands/bands';

import {onBrushMove, createBrush} from './brush';
import {onCursorMove, createClickCursor} from './cursor';
import {drawSexChromosomes, setSexChromosomes} from './sex-chromosomes';
import {convertBpToPx, convertPxToBp} from './coordinate-converters';
import {
  unpackAnnots, packAnnots, initCrossFilter, filterAnnots
} from './filter';

import {
  assemblyIsAccession, getDataDir, round, onDidRotate, getSvg, d3,
  getTaxid, getCommonName, getScientificName, fetch as _fetch,
  isRoman, parseRoman
} from './lib';

import {
  getChromosomeModel, getChromosomePixels
} from './views/chromosome-model';

import {
  appendHomolog, drawChromosome, rotateAndToggleDisplay, setOverflowScroll
} from './views/draw-chromosomes';

import {
  drawChromosomeLabels, rotateChromosomeLabels
} from './views/chromosome-labels.js';

import {
  _initRelatedGenes, plotRelatedGenes, getRelatedGenesByType
} from './kit/related-genes';

export default class Ideogram {
  constructor(config) {

    // Functions from init.js
    this.configure = configure;
    this.initDrawChromosomes = initDrawChromosomes;
    this.onLoad = onLoad;
    this.handleRotateOnClick = handleRotateOnClick;
    this.init = init;
    this.finishInit = finishInit;
    this.writeContainer = writeContainer;

    // Functions from annotations.js
    this.onLoadAnnots = onLoadAnnots;
    this.onDrawAnnots = onDrawAnnots;
    this.processAnnotData = processAnnotData;
    this.restoreDefaultTracks = restoreDefaultTracks;
    this.updateDisplayedTracks = updateDisplayedTracks;
    this.initAnnotSettings = initAnnotSettings;
    this.fetchAnnots = fetchAnnots;
    this.drawAnnots = drawAnnots;
    this.getHistogramBars = getHistogramBars;
    this.drawHeatmaps = drawHeatmaps;
    this.deserializeAnnotsForHeatmap = deserializeAnnotsForHeatmap;
    this.fillAnnots = fillAnnots;
    this.drawProcessedAnnots = drawProcessedAnnots;
    this.drawSynteny = drawSynteny;
    this.startHideAnnotTooltipTimeout = startHideAnnotTooltipTimeout;
    this.showAnnotTooltip = showAnnotTooltip;
    this.onWillShowAnnotTooltip = onWillShowAnnotTooltip;
    this.onClickAnnot = onClickAnnot;
    this.setOriginalTrackIndexes = setOriginalTrackIndexes;
    this.afterRawAnnots = afterRawAnnots;
    this.downloadAnnotations = downloadAnnotations;
    this.addAnnotLabel = addAnnotLabel;
    this.removeAnnotLabel = removeAnnotLabel;
    // this.fadeOutAnnotLabels = fadeOutAnnotLabels;
    this.fillAnnotLabels = fillAnnotLabels;
    this.clearAnnotLabels = clearAnnotLabels;

    this.highlight = highlight;
    this.unhighlight = unhighlight;

    // Variables and functions from services.js
    this.esearch = esearch;
    this.esummary = esummary;
    this.elink = elink;
    this.getOrganismFromEutils = getOrganismFromEutils;
    this.getTaxids = getTaxids;
    this.getAssemblyAndChromosomesFromEutils =
      getAssemblyAndChromosomesFromEutils;

    // Functions from bands.js
    this.drawBandLabels = drawBandLabels;
    this.getBandColorGradients = getBandColorGradients;
    this.processBandData = processBandData;
    this.setBandsToShow = setBandsToShow;
    this.hideUnshownBandLabels = hideUnshownBandLabels;
    this.drawBandLabelText = drawBandLabelText;
    this.drawBandLabelStalk = drawBandLabelStalk;

    // Functions from brush.js
    this.onBrushMove = onBrushMove;
    this.createBrush = createBrush;

    // Functions from cursor.js
    this.createClickCursor = createClickCursor;
    this.onCursorMove = onCursorMove;

    // Functions from sex-chromosomes.js
    this.drawSexChromosomes = drawSexChromosomes;
    this.setSexChromosomes = setSexChromosomes;

    // Functions from coordinate-converters.js
    this.convertBpToPx = convertBpToPx;
    this.convertPxToBp = convertPxToBp;

    // Functions from filter.js
    this.unpackAnnots = unpackAnnots;
    this.packAnnots = packAnnots;
    this.initCrossFilter = initCrossFilter;
    this.filterAnnots = filterAnnots;

    // Functions from lib
    this.assemblyIsAccession = assemblyIsAccession;
    this.getDataDir = getDataDir;
    this.round = round;
    this.onDidRotate = onDidRotate;
    this.getSvg = getSvg;
    this.fetch = _fetch;
    this.getTaxid = getTaxid;
    this.getCommonName = getCommonName;
    this.getScientificName = getScientificName;

    // Functions from views/chromosome-model.js
    this.getChromosomeModel = getChromosomeModel;
    this.getChromosomePixels = getChromosomePixels;

    // Functions from views/chromosome-labels.js
    this.drawChromosomeLabels = drawChromosomeLabels;
    this.rotateChromosomeLabels = rotateChromosomeLabels;

    // Functions from views/draw-chromosomes.js
    this.appendHomolog = appendHomolog;
    this.drawChromosome = drawChromosome;
    this.rotateAndToggleDisplay = rotateAndToggleDisplay;
    this.setOverflowScroll = setOverflowScroll;

    this.plotRelatedGenes = plotRelatedGenes;
    this.getRelatedGenesByType = getRelatedGenesByType;

    this.configure(config);
  }

  /**
   * Get the current version of Ideogram.js
   */
  static get version() {
    return version;
  }

  /**
  * Enable use of D3 in client apps, via "d3 = Ideogram.d3"
  */
  static get d3() {
    return d3;
  }

  /**
   * Request data from Ensembl REST API
   * Docs: https://rest.ensembl.org/
   *
   * @param {String} path URL path
   * @param {Object} body POST body
   * @param {String} method HTTP method; 'GET' (default) or 'POST'
   */
  static async fetchEnsembl(path, body = null, method = 'GET') {
    const init = {
      method: method
    };
    if (body !== null) init.body = JSON.stringify(body);
    if (method === 'GET') {
      // Use HTTP parameter, not header, to avoid needless OPTIONS request
      const delimiter = path.includes('&') ? '&' : '?';
      path += delimiter + 'content-type=application/json';
    } else {
      // Method is POST, so content-type must be defined in header
      init.headers = {'Content-Type': 'application/json'};
    }

    // const random = Math.random();
    // console.log(random)
    // if (random < 0.5) {
    const response = await fetch(`https://rest.ensembl.org${path}`, init);
    const json = await response.json();
    return json;
    // } else {
    //   // Mock error
    //   init.headers = {'Content-Type': 'application/json'};
    //   const response = await fetch('https://httpstat.us/500/cors', init);
    //   const json = await response.json();
    //   return json;
    // }
  }

  /**
   * Helper for sortChromosomes().
   * Gets names and biological types for diverse chromosome variables
   */
  static getChrSortNamesAndTypes(a, b) {
    var chrAName, chrBName,
      aIsCP, bIsCP, aIsMT, bIsMT, aIsAP, bIsAP, aIsNuclear, bIsNuclear;

    if (typeof a === 'string' || 'chr' in a && 'annots' in a) {
      // Chromosome data is from either:
      //    - Ideogram static file cache (e.g. homo-sapiens.json)
      //    - Ideogram raw annotations
      chrAName = (typeof a === 'string') ? a : a.chr;
      chrBName = (typeof b === 'string') ? b : b.chr;

      aIsCP = chrAName === 'CP';
      bIsCP = chrBName === 'CP';
      aIsMT = chrAName === 'MT';
      bIsMT = chrBName === 'MT';
      aIsAP = chrAName === 'AP';
      bIsAP = chrBName === 'AP';
      aIsNuclear = (!aIsCP && !aIsMT && !aIsAP);
      bIsNuclear = (!bIsCP && !bIsMT && !bIsAP);
    } else {
      // Chromosome data is from NCBI E-Utils web API
      chrAName = a.name;
      chrBName = b.name;

      aIsCP = a.type === 'chloroplast';
      bIsCP = b.type === 'chloroplast';
      aIsMT = a.type === 'mitochondrion';
      bIsMT = b.type === 'mitochondrion';
      aIsAP = a.type === 'apicoplast';
      bIsAP = b.type === 'apicoplast';
      aIsNuclear = a.type === 'nuclear';
      bIsNuclear = b.type === 'nuclear';
    }

    const chrTypes = {
      aIsNuclear, bIsNuclear, aIsCP, bIsCP, aIsMT, bIsMT, aIsAP, bIsAP
    };

    return [chrAName, chrBName, chrTypes];
  }

  /**
   * Sorts two chromosome objects by type and name
   * - Nuclear chromosomes come before non-nuclear chromosomes.
   * - Among nuclear chromosomes, use "natural sorting", e.g.
   *   numbers come before letters
   * - Among non-nuclear chromosomes, i.e. "MT" (mitochondrial DNA) and
   *   "CP" (chromoplast DNA), MT comes first
   *
   *
   * @param a Chromosome string or object "A"
   * @param b Chromosome string or object "B"
   * @returns {Number} JavaScript sort order indicator
   */
  static sortChromosomes(a, b) {

    let [chrAName, chrBName, chrTypes] =
      Ideogram.getChrSortNamesAndTypes(a, b);

    const {
      aIsNuclear, bIsNuclear, aIsCP, bIsCP, aIsMT, bIsMT, aIsAP, bIsAP
    } = chrTypes;

    if (aIsNuclear && bIsNuclear) {

      if (isRoman(chrAName) && isRoman(chrBName)) {
        // As in yeast genome
        chrAName = parseRoman(chrAName).toString();
        chrBName = parseRoman(chrBName).toString();
      }

      return chrAName.localeCompare(chrBName, 'en', {numeric: true});
    } else if (!aIsNuclear && bIsNuclear) {
      return 1;
    } else if (aIsMT && bIsCP) {
      return 1;
    } else if (aIsCP && bIsMT) {
      return -1;
    } else if (!aIsAP && !aIsMT && !aIsCP && (bIsMT || bIsCP || bIsAP)) {
      return -1;
    }
  }

  /**
   * Wrapper for Ideogram constructor, with generic "Related genes" options
   *
   * @param {Object} config Ideogram configuration object
   */
  static initRelatedGenes(config, annotsInList='all') {
    return _initRelatedGenes(config, annotsInList);
  }
}
