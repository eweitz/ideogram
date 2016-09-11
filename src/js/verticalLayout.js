/**
 * @public
 * @class
 * @param {Object} config
 */
function VerticalLayout(config) {
    /**
     * @private
     * @member {Object}
     */
    this._config = config;
    /**
     * @private
     * @member {String}
     */
    this._class = 'VerticalLayout';
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


VerticalLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return 'rotate(-90)';
};


VerticalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return 'rotate(90) translate(30, -' + this._getChromosomeSetHorizontalTranslate(setNumber) + ')';
};


/**
 * Get chromosome set horizontal offset.
 * @private
 * @param {Integer} setNumber
 * @returns {Number}
 */
VerticalLayout.prototype._getChromosomeSetHorizontalTranslate = function(setNumber) {
    /*
     * If no detailed description provided just use one formula for all cases.
     */
    if (! this._config.ploidyDesc) {
        return 30 * (setNumber) + this._config.chrWidth;
    }
    /*
     * Id detailed description provided start to calculate offsets
     * for each chromosome set separately. This should be done only once.
     */
    if (! this._translate) {
        /*
         * First offset equals to zero.
         */
        this._translate = [this._description.getSetSize(0) * 20 + (this._config.ploidy > 1 ? 20 : 0)];
        /*
         * Loop through description set.
         */
        for (var i = 1; i < this._config.ploidyDesc.length; i ++) {
            /*
             * Get set size.
             */
            var setSize = this._description.getSetSize(i);
            /*
             * Add new offset into translate array.
             */
            this._translate[i] = this._translate[i - 1] + setSize * 20 + (this._config.ploidy > 1 ? 20 : 0);
        };
    }

    return this._translate[setNumber];
};


VerticalLayout.prototype.getChromosomeSetLabelXPosition = function(setNumber) {

    return ((this._description.getSetSize(setNumber) * this._config.chrWidth + 20) / - 2) + (this._config.ploidy > 1 ? 0 : this._config.chrWidth);
}


VerticalLayout.prototype.getChromosomeSetLabelYPosition = function(i) {

    return -2 * this._config.chrWidth;
}


VerticalLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return this._config.chrWidth / - 2;
}


VerticalLayout.prototype.getChromosomeLabelYPosition = function(i) {

    return -5;
}