/**
 * @public
 * @class
 * @param {Object} config
 */
function HorizontalLayout(config) {
    /**
     * @private
     * @member {Object}
     */
    this._config = config;
    /**
     * @private
     * @member {String}
     */
    this._class = 'HorizontalLayout';
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
}


HorizontalLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return null;
};


HorizontalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return "translate(25, " + this._getChromosomeSetHorizontalTranslate(setNumber) + ")";
};


/**
 * Get chromosome set horizontal offset.
 * @private
 * @param {Integer} setNumber
 * @returns {Number}
 */
HorizontalLayout.prototype._getChromosomeSetHorizontalTranslate = function(setNumber) {
    /*
     * If no detailed description provided just use one formula for all cases.
     */
    if (! this._config.ploidyDesc) {
        return 20 * (setNumber + 1);
    }
    /*
     * Id detailed description provided start to calculate offsets
     * for each chromosome set separately. This should be done only once.
     */
    if (! this._translate) {
        /*
         * First offset equals to zero.
         */
        this._translate = [1];
        /*
         * Loop through description set.
         */
        for (var i = 1; i < this._config.ploidyDesc.length; i ++) {
            /*
             * Get set size.
             */
            var setSize = this._description.getSetSize(i - 1);
            /*
             * Add new offset into translate array.
             */
            this._translate[i] = this._translate[i - 1] + setSize * this._config.chrWidth * 2 + (this._config.ploidy > 1 ? 20 : 0);
        };
    }

    return this._translate[setNumber];
};


HorizontalLayout.prototype.getChromosomeSetLabelXPosition = function(i) {

    return -20;
}


HorizontalLayout.prototype.getChromosomeSetLabelYPosition = function(i) {

    return this._description.getSetSize(i) * this._config.chrWidth;
}


HorizontalLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return -8;
}


HorizontalLayout.prototype.getChromosomeLabelYPosition = function(i) {

    return this._config.chrWidth;
}