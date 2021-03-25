import {organismMetadata} from './organism-metadata';
import {staticCss} from './../bands/styles';

function configurePloidy(ideo) {
  if (!ideo.config.ploidy) ideo.config.ploidy = 1;

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

    if (container === 'body' || chrHeight === 0) chrHeight = 400;
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
  if (ideo.config.geometry && ideo.config.geometry === 'collinear') {
    if ('chrMargin' in ideo.config === false) {
      ideo.config.chrMargin = 0;
    }
    return;
  }
  if (!ideo.config.chrMargin) {
    if (ideo.config.ploidy === 1) {
      ideo.config.chrMargin = 10;
    } else {
      // Defaults polyploid chromosomes to relatively small interchromatid gap
      ideo.config.chrMargin = Math.round(ideo.config.chrWidth / 4);
    }
  }
  if (ideo.config.showBandLabels) ideo.config.chrMargin += 20;
}

function configureBump(ideo) {
  ideo.bump = Math.round(ideo.config.chrHeight / 125);
  ideo.adjustedBump = false;
  if (ideo.config.chrHeight < 200) {
    ideo.adjustedBump = true;
    ideo.bump = 4;
  }
}

function configureSingleChromosome(config, ideo) {
  if (config.chromosome) {
    ideo.config.chromosomes = [config.chromosome];
    if ('showBandLabels' in config === false) {
      ideo.config.showBandLabels = true;
    }
    if ('rotatable' in config === false) ideo.config.rotatable = false;
  }
}

function configureOrganisms(ideo) {
  ideo.organisms = Object.assign({}, organismMetadata);
  ideo.organismsWithBands = Object.assign({}, ideo.organisms);
}

function configureCallbacks(config, ideo) {
  if (config.onLoad) ideo.onLoadCallback = config.onLoad;
  if (config.onLoadAnnots) ideo.onLoadAnnotsCallback = config.onLoadAnnots;
  if (config.onDrawAnnots) ideo.onDrawAnnotsCallback = config.onDrawAnnots;
  if (config.onBrushMove) ideo.onBrushMoveCallback = config.onBrushMove;
  if (config.onBrushEnd) ideo.onBrushEndCallback = config.onBrushEnd;
  if (config.onCursorMove) ideo.onCursorMoveCallback = config.onCursorMove;
  if (config.onDidRotate) ideo.onDidRotateCallback = config.onDidRotate;
  if (config.onWillShowAnnotTooltip) {
    ideo.onWillShowAnnotTooltipCallback = config.onWillShowAnnotTooltip;
  }
  if (config.onClickAnnot) {
    ideo.onClickAnnotCallback = config.onClickAnnot;
  }
}

function configureMiscellaneous(ideo) {
  ideo.chromosomesArray = [];
  ideo.coordinateSystem = 'iscn';
  ideo.maxLength = {bp: 0, iscn: 0};
  ideo.chromosomes = {};
  ideo.numChromosomes = 0;
  if (!ideo.config.debug) ideo.config.debug = false;
  if (!ideo.config.dataDir) ideo.config.dataDir = ideo.getDataDir();
  if (!ideo.config.container) ideo.config.container = 'body';
  ideo.selector = ideo.config.container + ' #_ideogram';
  if (!ideo.config.resolution) ideo.config.resolution = '';
  if (!ideo.config.orientation) ideo.config.orientation = 'vertical';
  if (!ideo.config.brush) ideo.config.brush = null;
  if (!ideo.config.rows) ideo.config.rows = 1;
  if ('showChromosomeLabels' in ideo.config === false) {
    ideo.config.showChromosomeLabels = true;
  }
  if (!ideo.config.showNonNuclearChromosomes) {
    ideo.config.showNonNuclearChromosomes = false;
  }
  if (!ideo.config.chromosomeScale) {
    ideo.config.chromosomeScale = 'absolute';
  }
  if (!ideo.config.showTools) ideo.config.showTools = false;
}

function configureBands(ideo) {
  if (!ideo.config.showBandLabels) ideo.config.showBandLabels = false;

  if ('showFullyBanded' in ideo.config === false) {
    ideo.config.showFullyBanded = true;
  }

  ideo.bandsToShow = [];
  ideo.bandData = {};
}

let configuredCss = staticCss;
function configureTextStyle(ideo) {
  const config = ideo.config;
  if (!config.chrLabelSize) ideo.config.chrLabelSize = 9;
  if (!config.chrLabelColor) ideo.config.chrLabelColor = '#000';

  const size = `font-size: ${config.chrLabelSize}px`;
  const color = `fill: ${config.chrLabelColor}`;
  configuredCss += `#_ideogram text {${size}; ${color};}`;
}

/**
 * High-level helper method for Ideogram constructor.
 *
 * @param config Configuration object.  Enables setting Ideogram properties.
 *
 * Docs: https://github.com/eweitz/ideogram/blob/master/api.md
 */
function configure(config) {
  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));

  configureMiscellaneous(this);
  configurePloidy(this);
  configureBands(this);
  configureHeight(this);
  configureWidth(this);
  configureMargin(this);
  configureCallbacks(config, this);
  configureOrganisms(this);
  configureBump(this);
  configureSingleChromosome(config, this);
  configureTextStyle(this);
  this.initAnnotSettings();
  if (!this.config.geometry || this.config.geometry === 'parallel') {
    this.config.chrMargin += this.config.chrWidth;
    if (this.config.annotationsLayout === 'heatmap') {
      this.config.chrMargin += this.config.annotTracksHeight;
    } else {
      this.config.chrMargin += this.config.annotTracksHeight * 2;
    }
  }
  this.init();
}

export {configure, configuredCss};
