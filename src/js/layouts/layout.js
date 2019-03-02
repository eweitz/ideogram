import {d3} from '../lib';
import {ChromosomeUtil} from './../views/chromosome-util';

class Layout {

  constructor(config, ideo) {
    this._config = config;
    this._ideo = ideo;
    this._ploidy = this._ideo._ploidy;
    this._translate = undefined;

    if ('chrSetMargin' in config) {
      this.chrSetMargin = config.chrSetMargin;
    } else {
      var chrMargin = this._config.chrMargin;
      this.chrSetMargin = (this._config.ploidy > 1 ? chrMargin : 0);
    }

    // Chromosome band's size.
    this._tickSize = 8;

    // Chromosome rotation state.
    this._isRotated = false;
  }

  // Get chart left margin
  _getLeftMargin() {
    return this.margin.left;
  }

  // Get rotated chromosome y scale
  _getYScale() {
    // 20 is width of rotated chromosome.
    return 20 / this._config.chrWidth;
  }

  // Get chromosome labels
  getChromosomeLabels(chrElement) {
    var util = new ChromosomeUtil(chrElement),
      labels = [];

    if (this._ideo.config.ploidy > 1) {
      labels.push(util.getSetLabel());
    }
    labels.push(util.getLabel());

    return labels.filter(function(d) {
      return d.length > 0;
    });
  }

  getChromosomeBandLabelTranslate(band) {
    var x, y, translate,
      ideo = this._ideo,
      tickSize = this._tickSize,
      orientation = ideo.config.orientation;

    if (orientation === 'vertical') {
      x = tickSize;
      y = ideo.round(2 + band.px.start + band.px.width/2);
      translate = "rotate(-90)translate(" + x + "," + y + ")";
    } else if (orientation === 'horizontal') {
      x = ideo.round(-tickSize + band.px.start + band.px.width / 2);
      y = -10;
      translate = 'translate(' + x + ',' + y + ')';
    }

    return {
      x: x,
      y: y,
      translate: translate
    };
  }

  didRotate(chrIndex, chrElement) {
    var ideo, taxid, chrName, bands, chrModel, oldWidth,
      chrSetElement, transform, scale, scaleRE;

    ideo = this._ideo;
    taxid = ideo.config.taxid;
    chrName = chrElement.id.split('-')[0].replace('chr', '');
    chrModel = ideo.chromosomes[taxid][chrName];
    bands = chrModel.bands;

    chrSetElement = d3.select(chrElement.parentNode);
    transform = chrSetElement.attr('transform');
    scaleRE = /scale\(.*\)/;
    scale = scaleRE.exec(transform);
    transform = transform.replace(scale, '');
    chrSetElement.attr('transform', transform);

    oldWidth = chrModel.width;

    chrModel = ideo.getChromosomeModel(bands, chrName, taxid, chrIndex);

    chrModel.oldWidth = oldWidth;

    ideo.chromosomes[taxid][chrName] = chrModel;
    ideo.drawChromosome(chrModel);

    ideo.handleRotateOnClick();

    if (ideo.rawAnnots) {
      if (ideo.displayedTrackIndexes) {
        ideo.updateDisplayedTracks(ideo.displayedTrackIndexes);
      } else {
        ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
        ideo.drawProcessedAnnots(ideo.annots);

        if (ideo.config.filterable) {
          ideo.initCrossFilter();
        }
      }
    }

    if (ideo.config.showBandLabels === true) {
      ideo.drawBandLabels(ideo.chromosomes);
      ideo.hideUnshownBandLabels();
    }

    if (ideo.onDidRotateCallback) {
      ideo.onDidRotateCallback(chrModel);
    }
  }

  rotate(chrSetIndex, chrIndex, chrElement) {
    var ideo, otherChrs, ideoBounds, labelSelectors;
    ideo = this._ideo;

    labelSelectors = (
      ideo.selector + ' .chrSetLabel, ' + ideo.selector + ' .chrLabel'
    );

    ideoBounds = document.querySelector(ideo.selector).getBoundingClientRect();

    // Find chromosomes which should be hidden
    otherChrs = d3.selectAll(ideo.selector + ' g.chromosome')
      .filter(function() {return this !== chrElement;});

    if (this._isRotated) {

      this._isRotated = false;

      ideo.config.chrHeight = ideo.config.chrHeightOriginal;
      ideo.config.chrWidth = ideo.config.chrWidthOriginal;
      ideo.config.annotationHeight = ideo.config.annotationHeightOriginal;

      // Rotate chromosome back
      this.rotateBack(chrSetIndex, chrIndex, chrElement, function() {
        // Show all other chromosomes and chromosome labels
        otherChrs.style('display', null);
        d3.selectAll(labelSelectors).style('display', null);
        ideo._layout.didRotate(chrIndex, chrElement);
      });

    } else {

      this._isRotated = true;

      // Hide all other chromosomes and chromosome labels
      otherChrs.style('display', 'none');
      d3.selectAll(labelSelectors).style('display', 'none');

      // Rotate chromosome
      this.rotateForward(chrSetIndex, chrIndex, chrElement, function() {

        var chrHeight, elementLength, windowLength;

        ideo.config.chrHeightOriginal = ideo.config.chrHeight;
        ideo.config.chrWidthOriginal = ideo.config.chrWidth;
        ideo.config.annotationHeightOriginal = ideo.config.annotationHeight;

        if (ideo._layout._class === 'VerticalLayout') {
          elementLength = ideoBounds.width;
          windowLength = window.innerWidth;
        } else {
          elementLength = ideoBounds.height - 10;
          windowLength = window.innerHeight - 10;
        }

        // Set chromosome height to window length or ideogram element length,
        // whichever is smaller.  This keeps whole chromosome viewable, while
        // also ensuring the height doesn't exceed what the user specified.
        chrHeight = (windowLength < elementLength ? windowLength : elementLength);
        chrHeight -= ideo.config.chrMargin * 2;
        ideo.config.chrHeight = chrHeight;

        // Account for chromosome label
        // TODO: Make this dynamic, not hard-coded
        ideo.config.chrWidth *= 2.3;

        ideo.config.annotationHeight *= 1.7;

        ideo._layout.didRotate(chrIndex, chrElement);
      });
    }
  }

  getChromosomeLabelClass() {
    if (this._config.ploidy === 1) {
      return 'chrLabel';
    } else {
      return 'chrSetLabel';
    }
  }

  _getAdditionalOffset() {
    var config = this._config;
    var numTracks = config.annotationsNumTracks || config.numAnnotTracks || 1;
    return (config.annotationHeight || 0) * numTracks;
  }

  _getChromosomeSetSize(chrSetIndex) {
    // Get last chromosome set size.
    var setSize = this._ploidy.getSetSize(chrSetIndex);

    // Increase offset by last chromosome set size
    return (
      setSize * this._config.chrWidth * 2 + (this.chrSetMargin)
    );
  }

  // Get chromosome set label anchor property
  getChromosomeSetLabelAnchor() {
    return 'middle';
  }

  // Get chromosome label y position.
  getChromosomeLabelYPosition() {
    return -5.5;
  }

  getChromosomeSetLabelYPosition(chrIndex) {
    if (this._config.ploidy === 1) {
      return this.getChromosomeLabelYPosition(chrIndex);
    } else {
      return -2 * this._config.chrWidth;
    }
  }

}

export default Layout