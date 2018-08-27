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

  if (config.onLoadAnnots) {
    this.onLoadAnnotsCallback = config.onLoadAnnots;
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

  if (config.onDidRotate) {
    this.onDidRotateCallback = config.onDidRotate;
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

export {configure}