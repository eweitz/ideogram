function configurePloidy(ideo) {

  if (!ideo.config.ploidy) {
    ideo.config.ploidy = 1;
  }

  if (ideo.config.ploidy > 1) {
    ideo.sexChromosomes = {};
    if (!ideo.config.sex) {
      // Default to 'male' per human, mouse reference genomes.
      // TODO: The default sex value should probably be the heterogametic sex,
      // i.e. whichever sex has allosomes that differ in morphology.
      // In mammals and most insects that is the male.
      // However, in birds and reptiles, that is female.
      ideo.config.sex = 'male';
    }
    if (ideo.config.ploidy === 2 && !ideo.config.ancestors) {
      ideo.config.ancestors = {M: '#ffb6c1', P: '#add8e6'};
      ideo.config.ploidyDesc = 'MP';
    }
  }
}

function configureHeight(ideo) {
  var container, rect, chrHeight;

  if (!ideo.config.chrHeight) {
    container = ideo.config.container;
    rect = document.querySelector(container).getBoundingClientRect();

    if (ideo.config.orientation === 'vertical') {
      chrHeight = rect.height;
    } else {
      chrHeight = rect.width;
    }

    if (container === 'body') {
      chrHeight = 400;
    }
    ideo.config.chrHeight = chrHeight;
  }
}

function configureWidth(ideo) {
  var chrWidth, chrHeight;

  if (!ideo.config.chrWidth) {
    chrWidth = 10;
    chrHeight = ideo.config.chrHeight;

    if (chrHeight < 900 && chrHeight > 500) {
      chrWidth = Math.round(chrHeight / 40);
    } else if (chrHeight >= 900) {
      chrWidth = Math.round(chrHeight / 45);
    }
    ideo.config.chrWidth = chrWidth;
  }
}

function configureMargin(ideo) {
  if (!ideo.config.chrMargin) {
    if (ideo.config.ploidy === 1) {
      ideo.config.chrMargin = 10;
    } else {
      // Defaults polyploid chromosomes to relatively small interchromatid gap
      ideo.config.chrMargin = Math.round(ideo.config.chrWidth / 4);
    }
  }
}


function configureOrganisms(ideo) {
  ideo.organisms = {
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
  }
}

function configureCallbacks(config, ideo) {
  if (config.onLoad) {
    ideo.onLoadCallback = config.onLoad;
  }
  if (config.onLoadAnnots) {
    ideo.onLoadAnnotsCallback = config.onLoadAnnots;
  }
  if (config.onDrawAnnots) {
    ideo.onDrawAnnotsCallback = config.onDrawAnnots;
  }
  if (config.onBrushMove) {
    ideo.onBrushMoveCallback = config.onBrushMove;
  }
  if (config.onWillShowAnnotTooltip) {
    ideo.onWillShowAnnotTooltipCallback = config.onWillShowAnnotTooltip;
  }
  if (config.onDidRotate) {
    ideo.onDidRotateCallback = config.onDidRotate;
  }
}

/**
 * High-level helper method for Ideogram constructor.
 *
 * @param config Configuration object.  Enables setting Ideogram properties.
 */
function configure(config) {

  var orientation;

  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));

  if (!this.config.debug) {
    this.config.debug = false;
  }

  if (!this.config.dataDir) {
    this.config.dataDir = this.getDataDir();
  }

  configurePloidy(this);

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

  if (!this.config.showBandLabels) {
    this.config.showBandLabels = false;
  }

  configureHeight(this);
  configureWidth(this);
  configureMargin(this);

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

  configureCallbacks(config, this);

  this.coordinateSystem = 'iscn';

  this.maxLength = {
    bp: 0,
    iscn: 0
  };

  configureOrganisms(this);

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