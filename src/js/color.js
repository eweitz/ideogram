/**
 * Color provider class.
 * @private
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
     * @member {SetDescription}
     */
    this._description = new PloidyDescription(config.ploidyDesc);
}


/**
 * Get chromosome arm color.
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


Color.prototype.getPolyploidBorderColor = function(chrSetNumber, chrNmber, armNumber) {

    if (chrNmber < this._config.ploidy) {
        return '#000';
    } else {
        return '#fff';
    }
};


/**
 * Get polyploid organism chromosome arm's color.
 * @param chrSetNumber
 * @param chrNmber
 * @param armNumber
 * @returns {String}
 */
Color.prototype._getPolyploidArmColor = function(chrSetNumber, chrNmber, armNumber) {

    if (! this._description.isExists(chrSetNumber, chrNmber, armNumber)) {
        return 'transparent';
    } else {
        return this._config.ancestors[this._description.getAncestor(chrSetNumber, chrNmber, armNumber)];
    }
};