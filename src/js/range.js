/**
 * Chromosome range.
 * @public
 * @class
 * @param {Object} data - range data.
 * @param {Integer} data.chr - chromosome index.
 * @param {Integer[]} [data.ploidy] - array which controls on which chromosomes range should appear in case of ploidy.
 * @param {Integer} data.start - range start.
 * @param {Integer} data.stop - range end.
 * @param {String} data.color - range color.
 */
function Range(data) {
    /**
     * @private
     * @member {Object}
     */
    this._data = data;
};


/**
 * Get range start.
 * @public
 * @returns {Integer}.
 */
Range.prototype.getStart = function() {

    return this._data.start;
};


/**
 * Get range end.
 * @public
 * @returns {Integer}.
 */
Range.prototype.getStop = function() {

    return this._data.stop;
};


/**
 * Get range length.
 * @public
 * @returns {Integer}
 */
Range.prototype.getLength = function() {

    return this._data.stop - this._data.start;
};


/**
 * Get range color.
 * @public
 * @param {Intger} chrNumber - chromosome number.
 * @returns {String}
 */
Range.prototype.getColor = function(chrNumber) {

    if (! ('ploidy' in this._data)) {
        return this._getColor(chrNumber);
    } else if ('ploidy' in this._data && this._data.ploidy[chrNumber]) {
        return this._getColor(chrNumber);
    } else {
        return 'transparent';
    }

};


/**
 * Get range color.
 * @private
 * @param {Intger} chrNumber - chromosome number.
 * @returns {String}
 */
Range.prototype._getColor = function(chrNumber) {

    if (Array.isArray(this._data.color)) {
        return this._data.color[chrNumber];
    } else {
        return this._data.color;
    }
};