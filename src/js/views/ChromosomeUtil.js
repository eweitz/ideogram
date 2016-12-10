/**
 * Chromosome's view utility class.
 * @public
 * @class
 * @param {SVGElement} node - chromosome "g" container.
 */
function ChromosomeUtil(node) {
    /**
     * @private
     * @member {SVGElement}
     */
    this._node = node;
}


/**
 * Get chromosome label.
 * @public
 * @returns {String}
 */
ChromosomeUtil.prototype.getLabel = function() {

    return d3.select(this._node).select('text.chrLabel').text();
};


/**
 * Get chromosome set label.
 * @public
 * @returns {String}
 */
ChromosomeUtil.prototype.getSetLabel = function() {

    return d3.select(this._node.parentNode).select('text.chromosome-set-label').text();
};