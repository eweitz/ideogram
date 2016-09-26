/**
 * @public
 * @class
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function VerticalLayout(config, ideo) {
    /*
     * 
     */
    Layout.call(this, config, ideo);
    /**
     * @private
     * @member {String}
     */
    this._class = 'VerticalLayout';
    /**
     * Layout margins.
     * @private
     * @member {Object}
     */
    this._margin = {
        left : 30
    };
}


VerticalLayout.prototype = Object.create(Layout.prototype);


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeBandLabelTranslate = function(band) {

};


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return 'rotate(-90)';
};


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return 'rotate(90) translate(' + this._margin.left + ', -' + this.getChromosomeSetYTranslate(setNumber) + ')';
};


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    var annotationHeight = this._config.annotationHeight || 0;
    var additionalPadding = 0;

    if (this._config.annotationHeight) {
        additionalPadding = this._config.annotationHeight * (this._config.numAnnotTracks || 1);
    }
    /*
     * If no detailed description provided just use one formula for all cases.
     */
    if (! this._config.ploidyDesc) {
        /*
         * TODO: Here is we have magic number 10. It is simpliy adjusted to accomodate bars on histogramm view.
         * But it should be replaced with bar's maximum height...
         */
        return 10 + 35 * (setNumber) + this._config.chrWidth + additionalPadding * 2 + additionalPadding * setNumber;
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


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeSetLabelXPosition = function(setNumber) {

    return ((this._description.getSetSize(setNumber) * this._config.chrWidth + 20) / - 2) + (this._config.ploidy > 1 ? 0 : this._config.chrWidth);
};


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeSetLabelYPosition = function(i) {

    return -2 * this._config.chrWidth;
};


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return this._config.chrWidth / - 2;
};


/**
 * @override
 */
VerticalLayout.prototype.getChromosomeLabelYPosition = function(i) {

    return -5;
};