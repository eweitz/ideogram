/**
 * @public
 * @class
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function HorizontalLayout(config, ideo) {
    /*
     * 
     */
    Layout.call(this, config, ideo);
    /**
     * @private
     * @member {String}
     */
    this._class = 'HorizontalLayout';
    /**
     * Layout margins.
     * @private
     * @member {Object}
     */
    this._margin = {
        left : 25
    };
}


HorizontalLayout.prototype = Object.create(Layout.prototype);


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {

    return null;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeBandTickY1 = function(chrNumber) {

    return 2;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeBandTickY2 = function(chrNumber) {

    return 10;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeBandLabelTranslate = function(band) {

    var x = this._ideo.round(- this._tickSize + band.px.start + band.px.width / 2);
    var y = -10;

    return {
        x : x,
        y : y,
        translate : 'translate(' + x + ',' + y + ')'
    };
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return null;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return "translate(" + this._margin.left + ", " + this.getChromosomeSetYTranslate(setNumber) + ")";
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    var annotationHeight = this._config.annotationHeight || 0;
    var additionalPadding = 0;

    if (this._config.annotationHeight) {
        additionalPadding = this._config.annotationHeight * (this._config.numAnnotTracks || 1);
    }
    /*
     * If no detailed description provided just use one formula for all cases.
     */
    if (! this._config.ploidyDesc) {
        return 30 * (setNumber) + this._config.chrWidth + additionalPadding * 2 + additionalPadding * setNumber;
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


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeSetLabelXPosition = function(i) {

    return -20;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeSetLabelYPosition = function(i) {

    return this._description.getSetSize(i) * this._config.chrWidth;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return -8;
};


/**
 * @override
 */
HorizontalLayout.prototype.getChromosomeLabelYPosition = function(i) {

    return this._config.chrWidth;
};