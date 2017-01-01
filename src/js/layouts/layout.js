
function Layout(config, ideo) {
    this._config = config;
    this._ideo = ideo;
    this._ploidy = this._ideo._ploidy;
    this._translate = undefined;

     // Chromosome band's size.
    this._tickSize = 8;

    // Chromosome rotation state.
    this._isRotated = false;
}


// Factory method
Layout.getInstance = function(config, ideo) {

    if ("perspective" in config && config.perspective == "comparative") {
        return new PairedLayout(config, ideo);
    } else if ("rows" in config && config.rows > 1) {
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
Layout.prototype._getLeftMargin = function() {
    return this._margin.left;
};


// Get rotated chromosome y scale
Layout.prototype._getYScale = function() {
    // 20 is width of rotated chromosome.
    return 20 / this._config.chrWidth;
};


// Get chromosome labels
Layout.prototype.getChromosomeLabels = function(chrElement) {

    var util = new ChromosomeUtil(chrElement);

    return [util.getSetLabel(), util.getLabel()].filter(function(d) {
        return d.length > 0;
    });
};


// Rotate chromosome to original position
Layout.prototype.rotateBack = function(chrSetNumber, chrNumber, chrElement, callback) {

    throw new Error(this._class + '#rotateBack not implemented');
};


// Rotate chromosome to opposite position
Layout.prototype.rotateForward = function(chrSetNumber, chrNumber, chrElement, callback) {

    throw new Error(this._class + '#rotateForward not implemented');
};


Layout.prototype.rotate = function(chrSetNumber, chrNumber, chrElement) {
    // Find chromosomes which should be hidden
    var otherChrs = d3.selectAll("g.chromosome").filter(function(d, i) {
        return this !== chrElement;
    });

    if (this._isRotated) {

        // Reset _isRotated flag
        this._isRotated = false;
        // Rotate chromosome back
        this.rotateBack(chrSetNumber, chrNumber, chrElement, function() {
            // Show all other chromosomes and chromosome labels
            otherChrs.style("display", null);
            d3.selectAll(".chrSetLabel, .chrLabel").style("display", null);
        });
    } else {
        // Set _isRotated flag
        this._isRotated = true;

        // Hide all other chromosomes and chromosome labels
        otherChrs.style("display", "none");
        d3.selectAll(".chrSetLabel, .chrLabel").style("display", "none");

        // Rotate chromosome
        this.rotateForward(chrSetNumber, chrNumber, chrElement);
    }
};


Layout.prototype.getChromosomeLabelClass = function() {

    if (this._config.ploidy === 1) {
        return 'chrLabel';
    } else {
        return 'chrSetLabel';
    }
};


Layout.prototype._getAdditionalOffset = function() {

    return (this._config.annotationHeight || 0) * (this._config.numAnnotTracks || 1);
};


Layout.prototype._getChromosomeSetSize = function(chrSetNumber) {

    // Get last chromosome set size.
    var setSize = this._ploidy.getSetSize(chrSetNumber);

    // Increase offset by last chromosome set size
    return setSize * this._config.chrWidth * 2 + (this._config.ploidy > 1 ? 20 : 0);
};


// Get layout margin
Layout.prototype.getMargin = function() {

    return this._margin;
};


// Get SVG element height
Layout.prototype.getHeight = function(taxId) {

    throw new Error(this._class + '#getHeight not implemented');
};


Layout.prototype.getChromosomeBandTickY1 = function(chrNumber) {

    throw new Error(this._class + '#getChromosomeBandTickY1 not implemented');
};


Layout.prototype.getChromosomeBandTickY2 = function(chrNumber) {

    throw new Error(this._class + '#getChromosomeBandTickY2 not implemented');
};


// Get chromosome's band translate attribute
Layout.prototype.getChromosomeBandLabelTranslate = function(band, chrNumber) {

    throw new Error(this._class + '#getChromosomeBandLabelTranslate not implemented');
};


// Get chromosome set label anchor property
Layout.prototype.getChromosomeSetLabelAnchor = function() {

    return 'middle';
};


// Get chromosome's band label text-anchor value
Layout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {

    throw new Error(this._class + '#getChromosomeBandLabelAnchor not implemented');
};


Layout.prototype.getChromosomeLabelXPosition = function(i) {

    throw new Error(this._class + '#getChromosomeLabelXPosition not implemented');
};


// Get chromosome label y position. "i" is chromosome number
Layout.prototype.getChromosomeLabelYPosition = function(i) {

    return -5.5;
};


Layout.prototype.getChromosomeSetLabelYPosition = function(i) {

    if (this._config.ploidy === 1) {
        return this.getChromosomeLabelYPosition(i);
    } else {
        return -2 * this._config.chrWidth;
    }
};


Layout.prototype.getChromosomeSetLabelXPosition = function(i) {

    throw new Error(this._class + '#getChromosomeSetLabelXPosition not implemented');
};


Layout.prototype.getChromosomeSetLabelTranslate = function() {

    throw new Error(this._class + '#getChromosomeSetLabelTranslate not implemented');
};



// Get chromosome set translate attribute.
Layout.prototype.getChromosomeSetTranslate = function(setNumber) {

    throw new Error(this._class + '#getChromosomeSetTranslate not implemented');
};


// Get chromosome set translate's y offset
Layout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    throw new Error(this._class + '#getChromosomeSetYTranslate not implemented');
};
