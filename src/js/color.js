/**
 * @private
 * @class
 * @param {Object} config
 */
function Color(config) {

    this._config = config;
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
        throw new Exception('No color scheme provided');
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
    /*
     * Define color variable.
     */
    var color;
    /*
     * Get chromosome set code by number.
     */
    var chrSetCode = this._config.ploidyDesc[chrSetNumber];
    /*
     * If description defined as object get key of the object.
     */
    if (chrSetCode instanceof Object) {
        /*
         * Get chromosome set description object.
         */
        var chrSet = chrSetCode;
        /*
         * Redefine code.
         */
        chrSetCode = Object.keys(chrSet)[0];
        /*
         * Get description map.
         */
        var chrSetDesc = chrSet[chrSetCode];
        /*
         * Find ancestor letter.
         */
        var ancestor = chrSetCode.split('')[chrNmber];
        /*
         * Is chromosome exists (not absent/lost).
         */
        var isExists = Number(chrSetDesc[chrNmber].split('')[armNumber]);

        if (isExists) {
            color = this._config.ancestors[ancestor];
        } else {
            color = '#fff';
        }
    } else {
        /*
         * Find ancestor letter.
         */
        var ancestor = chrSetCode.split('')[chrNmber];
        /*
         * Return color by ancestor.
         */
        color = this._config.ancestors[ancestor];
    }
    /*
     * Return color by ancestor.
     */
    return color;
};


/**
 * @public
 * @return {String[]}
 */
Color.prototype.getColorSet = function() {

    if (this._config.armColors) {
        return this._config.armColors;
    } else if (this._config.ancestors) {
        return Object.values(this._config.ancestors);
    } else {
        throw new Exception('No color scheme provided');
    }
};