/**
 * Ploidy description class.
 * @public
 * @class
 * @param {Object} config - ideogram config
 */
function Ploidy(config) {
    /**
     * Ideogram config.
     * @private
     * @member {Object}
     */
    this._config = config;
    /**
     * Ploidy description.
     * @private
     * @member {undefined|Object[]}
     */
    this._description = this._normilize(this._config.ploidyDesc);
}


/**
 * Get amount of chromosomes within a set.
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


/**
 * Normalize use defined description.
 * @private
 * @param {Mixed[]}
 * @returns {Object[]}
 */
Ploidy.prototype._normilize = function(description) {
    /*
     * Return the same if no description provided.
     */
    if (! description) {
        return description;
    }
    /*
     * Array of normalized description objects.
     */
    var normalized = [];
    /*
     * Loop through description and normalize.
     */
    for (var key in description) {
        if (typeof description[key] == 'string') {
            normalized.push({
                ancestors : description[key],
                existance : this._getExistanceArray(description[key].length)
            });
        } else {
            normalized.push({
                ancestors : Object.keys(description[key])[0],
                existance : description[key][Object.keys(description[key])[0]]
            });
        }
    }

    return normalized;
};


/**
 * Get array filled by '11' elements.
 * @private
 * @param length
 */
Ploidy.prototype._getExistanceArray = function(length) {

    var array = [];

    for (var i = 0; i < length; i ++) {
        array.push('11');
    }

    return array;
};


/**
 * @public
 * @param chrSetNumber
 */
Ploidy.prototype.getSetSize = function(chrSetNumber) {

    if (this._description) {
        return this._description[chrSetNumber].ancestors.length;
    } else {
        return 1;
    }
};


/**
 * Get ancestor letter.
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @returns {String}
 */
Ploidy.prototype.getAncestor = function(chrSetNumber, chrNumber) {

    if (this._description) {
        return this._description[chrSetNumber].ancestors[chrNumber];
    } else {
        return '';
    }
};


/**
 * Check chromosome's arm should be rendered.
 * If no description was provided method will always returns true and
 * something another depending on user provided description.
 * @param chrSetNumber
 * @param chrNumber
 * @param armNumber
 * @returns {Boolean}
 */
Ploidy.prototype.isExists = function(chrSetNumber, chrNumber, armNumber) {

    if (this._description) {
        return Number(this._description[chrSetNumber].existance[chrNumber][armNumber]) > 0;
    } else {
        return true;
    }
};