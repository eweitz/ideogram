/**
 * @public
 * @class
 * @param {Object} config
 */
function HorizontalLayout(config) {
    /*
     * 
     */
    Layout.call(this, config);
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