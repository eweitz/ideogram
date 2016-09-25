/**
 * 
 */
function Layout(config) {
    /**
     * @private
     * @member {Object}
     */
    this._config = config;
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
};


/**
 * Factory method.
 * @public
 * @static
 * @param {Object} config
 * @return {Layout}
 */
Layout.getInstance = function(config) {

    if (config.orientation === 'vertical') {
        return new VerticalLayout(config);
    } else {
        return new HorizontalLayout(config);
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


/**
 * Get chromosome set translate attribute.
 * @public
 * @param {Integer} setNumber - chromosome set number
 * @return {String}
 */
Layout.prototype.getChromosomeSetTranslate = function(setNumber) {

    throw new Exception(this._class + '#getChromosomeSetTranslate not implemented');
}


/**
 * Get chromosome set translate's y offset.
 * @public
 * @param {Integer} setNumber - chromosome set number
 * @return {Number}
 */
Layout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    throw new Exception(this._class + '#getChromosomeSetYTranslate not implemented');
}