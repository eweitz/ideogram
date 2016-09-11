/**
 * @public
 * @class
 * @param {Object} config
 */
function Ploidy(config) {
    /**
     * Ideo config.
     * @private
     * @member {Object}
     */
    this._config = config;
}


/**
 * Get amount of chromosomes within set.
 * @param {Integer} setNumber
 * @returns {Integer}
 */
Ploidy.prototype.getChromosomesNumber = function(setNumber) {

    if (this._config.ploidyDesc) {
        var chrSetCode = this._config.ploidyDesc[setNumber];
        if (chrSetCode instanceof Object) {
            return Object.keys(chrSetCode)[0].length;
        } else {
            return chrSetCode.length;
        }
    } else {
        return this._config.ploidy || 1;
    }
};