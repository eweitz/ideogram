/**
 * @public
 * @class
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function PairedLayout(config, ideo) {
    /*
     * 
     */
    Layout.call(this, config, ideo);
    /**
     * @private
     * @member {String}
     */
    this._class = 'PairedLayout';
    /**
     * Layout margins.
     * @private
     * @member {Object}
     */
    this._margin = {
        left : 30
    };
}


PairedLayout.prototype = Object.create(Layout.prototype);


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandTickY1 = function(chrNumber) {

    return chrNumber % 2 ? this._config.chrWidth : this._config.chrWidth * 2;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandTickY2 = function(chrNumber) {

    return chrNumber % 2 ? this._config.chrWidth - this._tickSize : this._config.chrWidth * 2 + this._tickSize;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {

    return chrNumber % 2 ? null : 'end';
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandLabelTranslate = function(band, chrNumber) {

    var x = chrNumber % 2 ? 10 : - this._config.chrWidth - 10;
    var y = this._ideo.round(band.px.start + band.px.width / 2) + 3;

    return {
        x : y,
        y : y,
        translate : 'rotate(-90) translate(' + x + ', ' + y + ')'
    };
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return - this._tickSize;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeLabelYPosition = function(i) {

    return this._config.chrWidth;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetLabelYPosition = function(i) {

    return -2 * this._config.chrWidth;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetLabelXPosition = function(i) {

    return this._config.chrWidth / - 2;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return 'rotate(-90)';
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return 'rotate(90) translate(' + this._margin.left + ', -' + this.getChromosomeSetYTranslate(setNumber) + ')';
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    return 200 * (setNumber + 1);
};