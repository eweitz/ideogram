/**
 * 
 */
function Layout(config, ideo) {
    /**
     * @private
     * @member {Object}
     */
    this._config = config;
    /**
     * @private
     * @member {Ideogram}
     */
    this._ideo = ideo;
    /**
     * @private
     * @member {PloidyDescription}
     */
    this._description = new PloidyDescription(config.ploidyDesc);
    /**
     * Chromosome set's offset array.
     * @private
     * @member {Number[]}
     */
    this._translate = undefined;
    /**
     * Chromosome band's size.
     * @private
     * @member {Number}
     */
    this._tickSize = 8;
};


/**
 * Factory method.
 * @public
 * @static
 * @param {Object} config
 * @param {Ideogram} ideo
 * @return {Layout}
 */
Layout.getInstance = function(config, ideo) {

    if ("perspective" in config && config.perspective == "comparative") {
        return new PairedLayout(config, ideo);
    } else if (config.orientation === 'vertical') {
        return new VerticalLayout(config, ideo);
    } else {
        return new HorizontalLayout(config, ideo);
    }
};


/**
 * Get layout margin.
 * @public
 * @returns {Object}
 */
Layout.prototype.getMargin = function() {

    return this._margin;
};


Layout.prototype.getChromosomeBandTickY1 = function(chrNumber) {

    throw new Error(this._class + '#getChromosomeBandTickY1 not implemented');
};


Layout.prototype.getChromosomeBandTickY2 = function(chrNumber) {

    throw new Error(this._class + '#getChromosomeBandTickY2 not implemented');
};


/**
 * Get chromosome's band translate attribute.
 * @public
 * @param {Object} band
 * @param {Integer} chrNumber
 * @return {Object}
 */
Layout.prototype.getChromosomeBandLabelTranslate = function(band, chrNumber) {

    throw new Error(this._class + '#getChromosomeBandLabelTranslate not implemented');
};


/**
 * Get chromosome's band label text-anchor value.
 * @public
 * @param {Integer} chrNumber
 * @return {String|null}
 */
Layout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {

    throw new Error(this._class + '#getChromosomeBandLabelAnchor not implemented');
};


Layout.prototype.getChromosomeLabelXPosition = function(i) {

    throw new Error(this._class + '#getChromosomeLabelXPosition not implemented');
}


Layout.prototype.getChromosomeLabelYPosition = function(i) {

    throw new Error(this._class + '#getChromosomeLabelYPosition not implemented');
};


Layout.prototype.getChromosomeSetLabelYPosition = function(i) {

    throw new Error(this._class + '#getChromosomeSetLabelYPosition not implemented');
};


Layout.prototype.getChromosomeSetLabelXPosition = function(i) {

    throw new Error(this._class + '#getChromosomeSetLabelXPosition not implemented');
};


Layout.prototype.getChromosomeSetLabelTranslate = function() {

    throw new Error(this._class + '#getChromosomeSetLabelTranslate not implemented');
};


/**
 * Get chromosome set translate attribute.
 * @public
 * @param {Integer} setNumber - chromosome set number
 * @return {String}
 */
Layout.prototype.getChromosomeSetTranslate = function(setNumber) {

    throw new Error(this._class + '#getChromosomeSetTranslate not implemented');
}


/**
 * Get chromosome set translate's y offset.
 * @public
 * @param {Integer} setNumber - chromosome set number
 * @return {Number}
 */
Layout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    throw new Error(this._class + '#getChromosomeSetYTranslate not implemented');
}