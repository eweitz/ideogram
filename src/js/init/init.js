/**
 * @fileoveriew Methods for initialization
 */

import * as d3fetch from 'd3-fetch';
import * as d3selection from 'd3-selection';

import {Object} from '../lib';
import {configure} from './configure';
import {finishInit} from './finish-init';
import {writeContainer} from './write-container';

var d3 = Object.assign({}, d3fetch, d3selection);

/**
 * Configures chromosome data and calls downstream chromosome drawing functions
 */
function initDrawChromosomes(bandsArray) {
  var ideo = this,
    taxids = ideo.config.taxids,
    ploidy = ideo.config.ploidy,
    chrIndex = 0,
    taxid, bands, i, j, chrs, chromosome, chrModel;

  if (bandsArray.length > 0) {
    ideo.bandsArray = {};
  }

  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];
    chrs = ideo.config.chromosomes[taxid];

    if (
      typeof chrBands !== 'undefined' &&
      chrs.length >= chrBands.length / 2
    ) {
      ideo.coordinateSystem = 'bp';
    }

    ideo.chromosomes[taxid] = {};

    ideo.setSexChromosomes(chrs);

    if ('bandsArray' in ideo) {
      ideo.bandsArray[taxid] = bandsArray;
    }

    for (j = 0; j < chrs.length; j++) {
      chromosome = chrs[j];
      if ('bandsArray' in ideo) {
        bands = bandsArray[chrIndex];
      }

      chrModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);

      chrIndex += 1;


      if (typeof chromosome !== 'string') {
        chromosome = chromosome.name;
      }

      ideo.chromosomes[taxid][chromosome] = chrModel;
      ideo.chromosomesArray.push(chrModel);

      if (
        'sex' in ideo.config &&
        (
          ploidy === 2 && ideo.sexChromosomes.index + 2 === chrIndex ||
          ideo.config.sex === 'female' && chrModel.name === 'Y'
        )
      ) {
        continue;
      }

      ideo.drawChromosome(chrModel);

    }

    if (ideo.config.showBandLabels === true) {
      ideo.drawBandLabels(ideo.chromosomes);
    }

    ideo.handleRotateOnClick();

    ideo._gotChrModels = true; // Prevent issue with errant rat centromeres
  }
}

/**
 * Attach any click handlers to rotate and toggle chromosomes
 */
function handleRotateOnClick() {
  var ideo = this;

  if (!('rotatable' in ideo.config && ideo.config.rotatable === false)) {
    d3.selectAll(ideo.selector + ' .chromosome').on('click', function () {
      ideo.rotateAndToggleDisplay(this);
    });
  } else {
    d3.selectAll(ideo.selector + ' .chromosome')
      .style('cursor', 'default');
  }
}


/**
 * Called when Ideogram has finished initializing.
 * Accounts for certain ideogram properties not being set until
 * asynchronous requests succeed, etc.
 */
function onLoad() {
  call(this.onLoadCallback);
}

/**
 * Initializes an ideogram.
 * Sets some high-level properties based on instance configuration,
 * fetches band and annotation data if needed, and
 * writes an SVG element to the document to contain the ideogram
 */
function init() {
  var taxid, i, svgClass, accession, promise,
    t0 = new Date().getTime(),
    ideo = this,
    config = ideo.config,
    bandsArray = [],
    numBandDataResponses = 0,
    resolution = config.resolution;

  promise = new Promise(function(resolve) {
    if (typeof config.organism === 'number') {
      // 'organism' is a taxid, e.g. 9606
      ideo.getOrganismFromEutils(function() {
        ideo.getTaxids(resolve);
      });
    } else {
      ideo.getTaxids(resolve);
    }
  });

  promise.then(function(taxids) {
    var organism;

    taxid = taxids[0];
    ideo.config.taxid = taxid;
    ideo.config.taxids = taxids;

    var assemblies,
      bandFileName;

    var bandDataFileNames = {
      9606: '',
      10090: ''
    };

    for (i = 0; i < taxids.length; i++) {
      taxid = String(taxids[i]);
      organism = ideo.organisms[taxid];

      if (!config.assembly) {
        ideo.config.assembly = 'default';
      }
      assemblies = organism.assemblies;

      if (ideo.assemblyIsAccession()) {
        accession = config.assembly;
      } else {
        accession = assemblies[config.assembly];
      }

      bandFileName = [Ideogram.slugify(organism.scientificName)];
      if (accession !== assemblies.default) {
        bandFileName.push(accession);
      }
      if (
        taxid === '9606' &&
        (accession in assemblies === 'false' &&
          Object.values(assemblies).includes(config.assembly) ||
          (resolution !== '' && resolution !== 850))
      ) {
        bandFileName.push(resolution);
      }
      bandFileName = bandFileName.join('-') + '.js';

      if (taxid === '9606' || taxid === '10090') {
        bandDataFileNames[taxid] = bandFileName;
      }

      if (
        typeof accession !== 'undefined' &&
        /GCA_/.test(config.assembly) === false &&
        typeof chrBands === 'undefined' && taxid in bandDataFileNames
      ) {

        var bandDataUrl = config.dataDir + bandDataFileNames[taxid];

        fetch(bandDataUrl)
          .then(function(response) {
            return response.text().then(function(text) {

              // Fetched data is a JavaScript variable, so assign it
              eval(text);

              // Ensures correct taxid is processed
              // in response callback; using simply upstream 'taxid' variable
              // gives the last *requested* taxid, which fails when dealing
              // with multiple taxa.
              var fetchedTaxid, tid, bandDataFileName;
              for (tid in bandDataFileNames) {
                bandDataFileName = bandDataFileNames[tid];
                if (
                  response.url.includes(bandDataFileName) &&
                  bandDataFileName !== ''
                ) {
                  fetchedTaxid = tid;
                }
              }

              ideo.bandData[fetchedTaxid] = chrBands;
              numBandDataResponses += 1;

              if (numBandDataResponses === taxids.length) {
                bandsArray = ideo.processBandData();
                ideo.writeContainer(bandsArray, taxid, t0);
              }
            });
          });
      } else {
        if (typeof chrBands !== 'undefined') {
          // If bands already available,
          // e.g. via <script> tag in initial page load
          ideo.bandData[taxid] = chrBands;
        }
        bandsArray = ideo.processBandData();
        ideo.writeContainer(bandsArray, taxid, t0);
      }
    }
  });
}

export {
  configure, initDrawChromosomes, handleRotateOnClick, setOverflowScroll,
  onLoad, init, finishInit, writeContainer
}
