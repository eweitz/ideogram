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
    /**
     * Chromosome set's offset array.
     * @private
     * @member {Number[]}
     */
    this._translate = undefined;
}


/**
 * Get chromosome set horizontal offset.
 * @private
 * @param {Integer} setNumber
 * @returns {Number}
 */
Ploidy.prototype._getChromosomeSetHorizontalTranslate = function(setNumber) {
    /*
     * If no detailed description provided just use one formula for all cases.
     */
    if (! this._config.ploidyDesc) {
        return 20 * (setNumber + 1);
    }
    /*
     * Id detailed description provided start to calculate offsets
     * for each chromosome set separately. This should be done only once.
     */
    if (! this._translate) {
        /*
         * First offset equals to zero.
         */
        this._translate = [0];
        /*
         * Loop through description set.
         */
        for (var i = 1; i < this._config.ploidyDesc.length; i ++) {
            /*
             * Get description of previous set.
             */
            var setDescription = this._config.ploidyDesc[i - 1];
            /*
             * If it is represented as object get it's only key.
             */
            if (setDescription instanceof Object) {
                setDescription = Object.keys(setDescription)[0];
            }
            /*
             * Get set size.
             */
            var setSize = setDescription.length;
            /*
             * Add new offset into translate array.
             */
            this._translate[i] = this._translate[i - 1] + (setSize - 1) * 20 + (this._config.ploidy > 1 ? 20 : 0);
        };
    }

    return this._translate[setNumber];
};


/**
 * Get chromosome set shift.
 * @public
 * @param {Integer} setNumber
 * @return {String}
 */
Ploidy.prototype.getChromosomeSetTranslate = function(setNumber) {

  if (this._config.orientation === "horizontal") {
    return "translate(15, " + this._getChromosomeSetHorizontalTranslate(setNumber) + ")";
  } else {
    return "translate(" + setNumber * (this._config.ploidy - 1) + ", 0)";
  }
};


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