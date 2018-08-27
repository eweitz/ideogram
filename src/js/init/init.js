/**
 * @fileoveriew Methods for initialization
 */

import * as d3fetch from 'd3-fetch';
import * as d3selection from 'd3-selection';

import {Ploidy} from '../ploidy';
import {Layout} from '../layouts/layout';
import {Object} from '../lib';
import {configure} from './configure';
import {finishInit} from './finish-init';

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

function setOverflowScroll() {

  var ideo, config, ideoWidth, ideoInnerWrap, ideoOuterWrap, ideoSvg,
    ploidy, ploidyPad;

  ideo = this;
  config = ideo.config;

  ideoSvg = d3.select(config.container + ' svg#_ideogram');
  ideoInnerWrap = d3.select(config.container + ' #_ideogramInnerWrap');
  ideoOuterWrap = d3.select(config.container + ' #_ideogramOuterWrap');

  ploidy = config.ploidy;
  ploidyPad = (ploidy - 1);

  if (
    config.orientation === 'vertical' &&
    config.perspective !== 'comparative'
  ) {
    ideoWidth = (ideo.numChromosomes + 2) * (config.chrWidth + config.chrMargin + ploidyPad);
  } else {
    return;
    // chrOffset = ideoSvg.select('.chromosome').nodes()[0].getBoundingClientRect();
    // ideoWidth = config.chrHeight + chrOffset.x + 1;
  }

  ideoWidth = Math.round(ideoWidth * ploidy / config.rows);

  // Ensures absolutely-positioned elements, e.g. heatmap overlaps, display
  // properly if ideogram container also has position: absolute
  ideoOuterWrap
    .style('height', ideo._layout.getHeight() + 'px')

  ideoInnerWrap
    .style('max-width', ideoWidth + 'px')
    .style('overflow-x', 'scroll')
    .style('position', 'absolute');
  ideoSvg.style('min-width', (ideoWidth - 5) + 'px');
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
                writeContainer();
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
        writeContainer();
      }
    }
  });

  /**
   * Writes the HTML elements that contain this ideogram instance.
   */
  function writeContainer() {

    if (ideo.config.annotationsPath) {
      ideo.fetchAnnots(ideo.config.annotationsPath);
    }

    // If ploidy description is a string, then convert it to the canonical
    // array format.  String ploidyDesc is used when depicting e.g. parental
    // origin each member of chromosome pair in a human genome.
    // See ploidy-basic.html for usage example.
    if (
      'ploidyDesc' in ideo.config &&
      typeof ideo.config.ploidyDesc === 'string'
    ) {
      var tmp = [];
      for (var i = 0; i < ideo.numChromosomes; i++) {
        tmp.push(ideo.config.ploidyDesc);
      }
      ideo.config.ploidyDesc = tmp;
    }
    // Organism ploidy description
    ideo._ploidy = new Ploidy(ideo.config);

    // Chromosome's layout
    ideo._layout = Layout.getInstance(ideo.config, ideo);

    svgClass = '';
    if (ideo.config.showChromosomeLabels) {
      if (ideo.config.orientation === 'horizontal') {
        svgClass += 'labeledLeft ';
      } else {
        svgClass += 'labeled ';
      }
    }

    if (
      ideo.config.annotationsLayout &&
      ideo.config.annotationsLayout === 'overlay'
    ) {
      svgClass += 'faint';
    }

    var gradients = ideo.getBandColorGradients();
    var svgWidth = ideo._layout.getWidth(taxid);
    var svgHeight = ideo._layout.getHeight(taxid);

    d3.select(ideo.config.container)
      .append('div')
      .attr('id', '_ideogramOuterWrap')
      .append('div')
      .attr('id', '_ideogramInnerWrap')
      .append('svg')
      .attr('id', '_ideogram')
      .attr('class', svgClass)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .html(gradients);

    ideo.isOnlyIdeogram = document.querySelectorAll('#_ideogram').length === 1;

    // Tooltip div setup w/ default styling.
    d3.select(ideo.config.container + ' #_ideogramOuterWrap').append("div")
      .attr('class', 'tooltip')
      .attr('id', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('padding', '4px')
      .style('font', '12px sans-serif')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('border-radius', '5px');

    ideo.finishInit(bandsArray, t0);
  }

}

export {
  configure, initDrawChromosomes, handleRotateOnClick, setOverflowScroll,
  onLoad, init, finishInit,
}
