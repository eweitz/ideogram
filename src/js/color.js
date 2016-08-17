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
    /*
     * Handle armColors option if provided.
     */
    if (this._config.armColors) {
        /*
         * Return color corresponding to arm number.
         */
        return this._config.armColors[armNumber];
    /*
     * Handle ancestors color scheme in case of ploidy.
     */
    } else if (this._config.ancestors) {
        /*
         * Get chromosome set description by number.
         */
        var chrSetDesc = this._config.ploidyDesc[chrSetNumber];
        /*
         * If description defined as object get key of the object.
         */
        if (chrSetDesc instanceof Object) {
            chrSetDesc = Object.keys(chrSetDesc)[0];
        }
        /*
         * Find ancestor letter.
         */
        var ancestor = chrSetDesc.split('')[chrNmber];
        /*
         * Return color by ancestor.
         */
        return this._config.ancestors[ancestor];
    /*
     * Throw exception in another case.
     */
    } else {
        throw new Exception('No color scheme provided');
    }
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