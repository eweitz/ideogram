export class Layout {

  constructor(config, ideo) {
    this._config = config;
    this._ideo = ideo;
    this._ploidy = this._ideo._ploidy;
    this._translate = undefined;

    if ('chrSetMargin' in config) {
      this.chrSetMargin = config.chrSetMargin;
    } else {
      var k = this._config.chrMargin;
      this.chrSetMargin = (this._config.ploidy > 1 ? k : 0);
    }

    // Chromosome band's size.
    this._tickSize = 8;

    // Chromosome rotation state.
    this._isRotated = false;
  }

  // Factory method
  static getInstance(config, ideo) {
    if ('perspective' in config && config.perspective === 'comparative') {
      return new PairedLayout(config, ideo);
    } else if ('rows' in config && config.rows > 1) {
      return new SmallLayout(config, ideo);
    } else if (config.orientation === 'vertical') {
      return new VerticalLayout(config, ideo);
    } else if (config.orientation === 'horizontal') {
      return new HorizontalLayout(config, ideo);
    } else {
      return new VerticalLayout(config, ideo);
    }
  };

  // Get chart left margin
  _getLeftMargin() {
    return this._margin.left;
  };

  // Get rotated chromosome y scale
  _getYScale() {
      // 20 is width of rotated chromosome.
    return 20 / this._config.chrWidth;
  };

  // Get chromosome labels
  getChromosomeLabels(chrElement) {
    var util = new ChromosomeUtil(chrElement);

    return [util.getSetLabel(), util.getLabel()].filter(function(d) {
      return d.length > 0;
    });
  };

  // Rotate chromosome to original position
  rotateBack() {
    throw new Error(this._class + '#rotateBack not implemented');
  };

  // Rotate chromosome to opposite position
  rotateForward() {
    throw new Error(this._class + '#rotateForward not implemented');
  };

  rotate(chrSetNumber, chrNumber, chrElement) {
    var ideo = this._ideo;

      // Find chromosomes which should be hidden
    var otherChrs = d3.selectAll(ideo.selector + ' g.chromosome')
      .filter(function() {
        return this !== chrElement;
      });

    if (this._isRotated) {
          // Reset _isRotated flag
      this._isRotated = false;
          // Rotate chromosome back
      this.rotateBack(chrSetNumber, chrNumber, chrElement, function() {
              // Show all other chromosomes and chromosome labels
        otherChrs.style('display', null);
        d3.selectAll(ideo.selector + ' .chrSetLabel, .chrLabel')
          .style('display', null);
      });
    } else {
          // Set _isRotated flag
      this._isRotated = true;

          // Hide all other chromosomes and chromosome labels
      otherChrs.style('display', 'none');
      d3.selectAll(ideo.selector + ' .chrSetLabel, .chrLabel')
        .style('display', 'none');

          // Rotate chromosome
      this.rotateForward(chrSetNumber, chrNumber, chrElement);
    }
  };

  getChromosomeLabelClass() {
    if (this._config.ploidy === 1) {
      return 'chrLabel';
    } else {
      return 'chrSetLabel';
    }
  };

  _getAdditionalOffset() {
    return (
      (this._config.annotationHeight || 0) * (this._config.numAnnotTracks || 1)
    );
  };

  _getChromosomeSetSize(chrSetNumber) {
    // Get last chromosome set size.
    var setSize = this._ploidy.getSetSize(chrSetNumber);

    // Increase offset by last chromosome set size
    return (
      setSize * this._config.chrWidth * 2 + (this.chrSetMargin)
    );
  };

  // Get layout margin
  getMargin() {
    return this._margin;
  };

  // Get SVG element height
  getHeight() {
    throw new Error(this._class + '#getHeight not implemented');
  };

  getChromosomeBandTickY1() {
    throw new Error(this._class + '#getChromosomeBandTickY1 not implemented');
  };

  getChromosomeBandTickY2() {
    throw new Error(this._class + '#getChromosomeBandTickY2 not implemented');
  };

  // Get chromosome's band translate attribute
  getChromosomeBandLabelTranslate() {
    throw new Error(
      this._class + '#getChromosomeBandLabelTranslate not implemented'
    );
  };

  // Get chromosome set label anchor property
  getChromosomeSetLabelAnchor() {
    return 'middle';
  };

  // Get chromosome's band label text-anchor value
  getChromosomeBandLabelAnchor() {
    throw (
      new Error(this._class + '#getChromosomeBandLabelAnchor not implemented')
    );
  };

  getChromosomeLabelXPosition() {
    throw new Error(this._class + '#getChromosomeLabelXPosition not implemented');
  };

  // Get chromosome label y position.
  getChromosomeLabelYPosition() {
    return -5.5;
  };

  // "i" is chromosome number
  getChromosomeSetLabelYPosition(i) {
    if (this._config.ploidy === 1) {
      return this.getChromosomeLabelYPosition(i);
    } else {
      return -2 * this._config.chrWidth;
    }
  };

  getChromosomeSetLabelXPosition() {
    throw (
      new Error(this._class + '#getChromosomeSetLabelXPosition not implemented')
    );
  };

  getChromosomeSetLabelTranslate() {
    throw (
      new Error(this._class + '#getChromosomeSetLabelTranslate not implemented')
    );
  };

  // Get chromosome set translate attribute
  getChromosomeSetTranslate() {
    throw new Error(this._class + '#getChromosomeSetTranslate not implemented');
  };

  // Get chromosome set translate's y offset
  getChromosomeSetYTranslate() {
    throw new Error(this._class + '#getChromosomeSetYTranslate not implemented');
  };
}
