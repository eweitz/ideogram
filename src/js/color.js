/**
 * Color provider class.
 * @public
 * @class
 * @param {Object} config
 */
function Color(config) {
    /**
     * Ideogram config.
     * @private
     * @member {Object}
     */
    this._config = config;
    /**
     * Ploidy description.
     * @private
     * @member {Ploidy}
     */
    this._ploidy = new Ploidy(this._config);
}


/**
 * Get chromosome's arm color.
 * @public
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNmber
 * @param {Integer} armNumber
 * @returns {String}
 */
Color.prototype.getArmColor = function(chrSetNumber, chrNmber, armNumber) {

    if (this._config.armColors) {
        return this._config.armColors[armNumber];
    } else if (this._config.ancestors) {
        return this._getPolyploidArmColor(chrSetNumber, chrNmber, armNumber);
    } else {
        return null;
    }
};


/**
 * Get chromosome's arm border color.
 * @public
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNmber
 * @param {0|1} armNumber
 * @returns {String}
 */
Color.prototype.getBorderColor = function(chrSetNumber, chrNmber, armNumber) {

    if (chrNmber < this._config.ploidy) {
        return '#000';
    } else if (this._ploidy.isExists(chrSetNumber, chrNmber, armNumber)) {
        return '#000';
    } else {
        return '#fff';
    }
};


/**
 * Get polyploid organism chromosome arm's color.
 * @private
 * @param chrSetNumber
 * @param chrNmber
 * @param armNumber
 * @returns {String}
 */
Color.prototype._getPolyploidArmColor = function(chrSetNumber, chrNmber, armNumber) {

    if (! this._ploidy.isExists(chrSetNumber, chrNmber, armNumber)) {
        return 'transparent';
    } else {
        return this._config.ancestors[this._ploidy.getAncestor(chrSetNumber, chrNmber, armNumber)];
    }
};