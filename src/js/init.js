/**
 * @fileoveriew Methods for initialization
 */

import * as d3request from 'd3-request';
import * as d3selection from 'd3-selection';
import {Promise} from 'es6-promise';

import {Ploidy} from './ploidy';
import {Layout} from './layouts/layout';
import {Object} from './lib.js';

var d3 = Object.assign({}, d3request, d3selection);

/**
 * High-level helper method for Ideogram constructor.
 *
 * @param config Configuration object.  Enables setting Ideogram properties.
 */
function configure(config) {

  var orientation,
    chrWidth, chrHeight,
    container, rect;

  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));

  if (!this.config.debug) {
    this.config.debug = false;
  }

  if (!this.config.dataDir) {
    this.config.dataDir = this.getDataDir();
  }

  if (!this.config.ploidy) {
    this.config.ploidy = 1;
  }

  if (this.config.ploidy > 1) {
    this.sexChromosomes = {};
    if (!this.config.sex) {
      // Default to 'male' per human, mouse reference genomes.
      // TODO: The default sex value should probably be the heterogametic sex,
      // i.e. whichever sex has allosomes that differ in morphology.
      // In mammals and most insects that is the male.
      // However, in birds and reptiles, that is female.
      this.config.sex = 'male';
    }
    if (this.config.ploidy === 2 && !this.config.ancestors) {
      this.config.ancestors = {M: '#ffb6c1', P: '#add8e6'};
      this.config.ploidyDesc = 'MP';
    }
  }

  if (!this.config.container) {
    this.config.container = 'body';
  }

  this.selector = this.config.container + ' #_ideogram';

  if (!this.config.resolution) {
    this.config.resolution = '';
  }

  if ('showChromosomeLabels' in this.config === false) {
    this.config.showChromosomeLabels = true;
  }

  if (!this.config.orientation) {
    orientation = 'vertical';
    this.config.orientation = orientation;
  }

  if (!this.config.chrHeight) {
    container = this.config.container;
    rect = document.querySelector(container).getBoundingClientRect();

    if (orientation === 'vertical') {
      chrHeight = rect.height;
    } else {
      chrHeight = rect.width;
    }

    if (container === 'body') {
      chrHeight = 400;
    }
    this.config.chrHeight = chrHeight;
  }

  if (!this.config.chrWidth) {
    chrWidth = 10;
    chrHeight = this.config.chrHeight;

    if (chrHeight < 900 && chrHeight > 500) {
      chrWidth = Math.round(chrHeight / 40);
    } else if (chrHeight >= 900) {
      chrWidth = Math.round(chrHeight / 45);
    }
    this.config.chrWidth = chrWidth;
  }

  if (!this.config.chrMargin) {
    if (this.config.ploidy === 1) {
      this.config.chrMargin = 10;
    } else {
      // Defaults polyploid chromosomes to relatively small interchromatid gap
      this.config.chrMargin = Math.round(this.config.chrWidth / 4);
    }
  }

  if (!this.config.showBandLabels) {
    this.config.showBandLabels = false;
  }

  if ('showFullyBanded' in this.config) {
    this.config.showFullyBanded = config.showFullyBanded;
  } else {
    this.config.showFullyBanded = true;
  }

  if (!this.config.brush) {
    this.config.brush = null;
  }

  if (!this.config.rows) {
    this.config.rows = 1;
  }

  this.bump = Math.round(this.config.chrHeight / 125);
  this.adjustedBump = false;
  if (this.config.chrHeight < 200) {
    this.adjustedBump = true;
    this.bump = 4;
  }

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }

  if (config.chromosome) {
    this.config.chromosomes = [config.chromosome];
    if ('showBandLabels' in config === false) {
      this.config.showBandLabels = true;
    }
    if ('rotatable' in config === false) {
      this.config.rotatable = false;
    }
  }

  if (!this.config.showNonNuclearChromosomes) {
    this.config.showNonNuclearChromosomes = false;
  }

  this.initAnnotSettings();

  this.config.chrMargin = (
    this.config.chrMargin +
    this.config.chrWidth +
    this.config.annotTracksHeight * 2
  );

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  if (config.onDrawAnnots) {
    this.onDrawAnnotsCallback = config.onDrawAnnots;
  }

  if (config.onBrushMove) {
    this.onBrushMoveCallback = config.onBrushMove;
  }

  if (config.onWillShowAnnotTooltip) {
    this.onWillShowAnnotTooltipCallback = config.onWillShowAnnotTooltip;
  }

  this.coordinateSystem = 'iscn';

  this.maxLength = {
    bp: 0,
    iscn: 0
  };

  this.organisms = {
    9606: {
      commonName: 'Human',
      scientificName: 'Homo sapiens',
      scientificNameAbbr: 'H. sapiens',
      assemblies: {
        default: 'GCF_000001405.26', // GRCh38
        GRCh38: 'GCF_000001405.26',
        GRCh37: 'GCF_000001405.13'
      }
    },
    10090: {
      commonName: 'Mouse',
      scientificName: 'Mus musculus',
      scientificNameAbbr: 'M. musculus',
      assemblies: {
        default: 'GCF_000001635.20'
      }
    },
    4641: {
      commonName: 'banana',
      scientificName: 'Musa acuminata',
      scientificNameAbbr: 'M. acuminata',
      assemblies: {
        default: 'mock'
      }
    }
  };

  // A flat array of chromosomes
  // (this.chromosomes is an object of
  // arrays of chromosomes, keyed by organism)
  this.chromosomesArray = [];

  this.bandsToShow = [];

  this.chromosomes = {};
  this.numChromosomes = 0;
  this.bandData = {};

  this.init();

}

/**
 * Configures chromosome data and calls downstream chromosome drawing functions
 */
function initDrawChromosomes(bandsArray) {
  var ideo = this,
    taxids = ideo.config.taxids,
    ploidy = ideo.config.ploidy,
    taxid,
    chrIndex = 0,
    chrSetNumber = 0,
    bands,
    i, j, chrs, chromosome, chrModel,
    defs, transform;

  defs = d3.select(ideo.selector + ' defs');

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

    for (j = 0; j < chrs.length; j++) {
      chromosome = chrs[j];
      bands = bandsArray[chrIndex];
      chrIndex += 1;

      chrModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);

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

      transform = ideo._layout.getChromosomeSetTranslate(chrSetNumber);
      chrSetNumber += 1;

      // Append chromosome set container
      var container = d3.select(ideo.selector)
        .append('g')
        .attr('class', 'chromosome-set-container')
        .attr('data-set-number', j)
        .attr('transform', transform)
        .attr('id', chrModel.id + '-chromosome-set');

      if (
        'sex' in ideo.config &&
        ploidy === 2 &&
        ideo.sexChromosomes.index + 1 === chrIndex
      ) {
        ideo.drawSexChromosomes(bandsArray, taxid, container, defs, j, chrs);
        continue;
      }

      var shape;
      var numChrsInSet = 1;
      if (ploidy > 1) {
        numChrsInSet = this._ploidy.getChromosomesNumber(j);
      }
      for (var k = 0; k < numChrsInSet; k++) {
        shape = ideo.drawChromosome(chrModel, chrIndex - 1, container, k);
      }

      defs.append('clipPath')
        .attr('id', chrModel.id + '-chromosome-set-clippath')
        .selectAll('path')
        .data(shape)
        .enter()
        .append('path')
        .attr('d', function(d) {
          return d.path;
        }).attr('class', function(d) {
        return d.class;
      });
    }

    if (ideo.config.showBandLabels === true) {
      ideo.drawBandLabels(ideo.chromosomes);
    }
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
  var taxid, i, svgClass;

  var ideo = this;

  var t0 = new Date().getTime();

  var bandsArray = [],
    numBandDataResponses = 0,
    resolution = this.config.resolution,
    accession;

  var promise = new Promise(function(resolve) {
    if (typeof ideo.config.organism === 'number') {
      // 'organism' is a taxid, e.g. 9606
      ideo.getOrganismFromEutils(function() {
        ideo.getTaxids(resolve);
      });
    } else {
      ideo.getTaxids(resolve);
    }
  });

  promise.then(function(taxids) {
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

      if (!ideo.config.assembly) {
        ideo.config.assembly = 'default';
      }
      assemblies = ideo.organisms[taxid].assemblies;

      if (ideo.assemblyIsAccession()) {
        accession = ideo.config.assembly;
      } else {
        accession = assemblies[ideo.config.assembly];
      }

      bandFileName = [];
      bandFileName.push(
        Ideogram.slugify(ideo.organisms[taxid].scientificName)
      );
      if (accession !== assemblies.default) {
        bandFileName.push(accession);
      }
      if (
        taxid === '9606' &&
        (accession in assemblies === 'false' &&
          Object.values(assemblies).indexOf(ideo.config.assembly) === -1 ||
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
        /GCA_/.test(ideo.config.assembly) === false &&
        typeof chrBands === 'undefined' && taxid in bandDataFileNames
      ) {
        d3.request(ideo.config.dataDir + bandDataFileNames[taxid])
          .on('beforesend', function(data) {
            // Ensures correct taxid is processed in response callback; using
            // simply 'taxid' variable gives the last *requested* taxid, which
            // fails when dealing with multiple taxa.
            data.taxid = taxid;
          })
          .get(function(error, data) {
            eval(data.response);

            ideo.bandData[data.taxid] = chrBands;
            numBandDataResponses += 1;

            if (numBandDataResponses === taxids.length) {
              bandsArray = ideo.processBandData();
              writeContainer();
            }
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
      .append('svg')
      .attr('id', '_ideogram')
      .attr('class', svgClass)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .html(gradients);

    // Tooltip div setup w/ default styling.
    d3.select(ideo.config.container).append("div")
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

    finishInit();
  }

  /**
   * Completes high-level initialization.
   * Draws chromosomes and band labels, rotating as needed;
   * processes and draws annotations;
   * creates brush, emits notification of load completion, etc.
   */
  function finishInit() {
    try {
      var t0A = new Date().getTime();

      var i;

      ideo.initDrawChromosomes(bandsArray);

      // Waits for potentially large annotation dataset
      // to be received by the client, then triggers annotation processing
      if (ideo.config.annotationsPath) {
        function pa() {
          if (typeof ideo.timeout !== 'undefined') {
            window.clearTimeout(ideo.timeout);
          }

          ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
          ideo.drawProcessedAnnots(ideo.annots);

          if (typeof crossfilter !== 'undefined' && ideo.initCrossFilter) {
            ideo.initCrossFilter();
          }
        }

        if (ideo.rawAnnots) {
          pa();
        } else {
          (function checkAnnotData() {
            ideo.timeout = setTimeout(function() {
                if (!ideo.rawAnnots) {
                  checkAnnotData();
                } else {
                  pa();
                }
              },
              50
            );
          })();
        }
      }

      if (ideo.config.showBandLabels === true) {
        var bandsToShow = ideo.bandsToShow.join(',');

        // d3.selectAll resolves to querySelectorAll (QSA).
        // QSA takes a surprisingly long time to complete,
        // and scales with the number of selectors.
        // Most bands are hidden, so we can optimize by
        // Hiding all bands, then QSA'ing and displaying the
        // relatively few bands that are shown.
        var t0C = new Date().getTime();
        d3.selectAll(ideo.selector + ' .bandLabel, .bandLabelStalk')
          .style('display', 'none');
        d3.selectAll(bandsToShow).style('display', '');
        var t1C = new Date().getTime();
        if (ideo.config.debug) {
          console.log('Time in showing bands: ' + (t1C - t0C) + ' ms');
        }

        if (ideo.config.orientation === 'vertical') {
          var chrID;
          for (i = 0; i < ideo.chromosomesArray.length; i++) {
            chrID = '#' + ideo.chromosomesArray[i].id;
            ideo.rotateChromosomeLabels(d3.select(chrID), i);
          }
        }
      }

      if (ideo.config.showChromosomeLabels === true) {
        ideo.drawChromosomeLabels(ideo.chromosomes);
      }

      if (ideo.config.brush) {
        ideo.createBrush(ideo.config.brush);
      }

      if (ideo.config.annotations) {
        ideo.drawAnnots(ideo.config.annotations);
      }

      var t1A = new Date().getTime();
      if (ideo.config.debug) {
        console.log('Time in drawChromosome: ' + (t1A - t0A) + ' ms');
      }

      var t1 = new Date().getTime();
      if (ideo.config.debug) {
        console.log('Time constructing ideogram: ' + (t1 - t0) + ' ms');
      }

      if (!('rotatable' in ideo.config && ideo.config.rotatable === false)) {
        d3.selectAll(ideo.selector + ' .chromosome').on('click', function() {
          ideo.rotateAndToggleDisplay(this);
        });
      } else {
        d3.selectAll(ideo.selector + ' .chromosome')
          .style('cursor', 'default');
      }

      if (ideo.onLoadCallback) {
        ideo.onLoadCallback();
      }
    } catch (e) {
      // console.log(e);
      throw e;
    }
  }
}

export {configure, initDrawChromosomes, onLoad, init};
