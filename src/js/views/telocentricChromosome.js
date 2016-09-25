/**
 * Telocentric chromosome view class.
 * @public
 * @class
 * @param {Object} model
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function TelocentricChromosome(model, config, ideo) {

    Chromosome.call(this, model, config, ideo);
    this._class = 'TelocentricChromosome';
}


TelocentricChromosome.prototype = Object.create(Chromosome.prototype);


TelocentricChromosome.prototype.getBumpsLength = function() {

    return this._bump * 3 + 4;
};


/**
 * Render chromosome right terminal.
 * @protected
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Object} position
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
TelocentricChromosome.prototype._renderRightTerminal = function(container, chrSetNumber, chrNumber, position, arm) {

    if (arm == 'p') {
        return this._renderTelocentricRightTerminal(container, chrSetNumber, chrNumber, position, arm);
    } else {
        return this._renderMetacentricRightTerminal(container, chrSetNumber, chrNumber, position, arm);
    }
};


/**
 * Render chromosome right telocentric terminal.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Object} position
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
TelocentricChromosome.prototype._renderTelocentricRightTerminal = function(container, chrSetNumber, chrNumber, position, arm) {

    var width = this._config.chrWidth;
    var x = 4;

    container.append('path')
        .attr('class', 'band acen')
        .attr('d', 'M1,1 L' + x + ',1 L' + x + ',' + (width - 1) + ' L1,' + (width - 1) + ' Z')
        .style('stroke', 'black')
        .style('stroke-width', 0.5);

    container.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', width)
        .style('stroke', 'black')
        .style('stroke-width', 2);

    return {
        offset: position.offset + x - 2,
        x: position.x + x
    };
};


/**
 * Render chromosome right metacentric terminal.
 * @param container
 * @param chrSetNumber
 * @param chrNumber
 * @param x
 * @param arm
 * @returns
 */
TelocentricChromosome.prototype._renderMetacentricRightTerminal = function(container, chrSetNumber, chrNumber, x, arm) {

    var chromosome = new MetacentricChromosome(this._model, this._config, this._ideo);
    chromosome._renderRightTerminal(container, chrSetNumber, chrNumber, x, arm);

    return x;
};


/**
 * Render chromosome left terminal.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Object} position
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
TelocentricChromosome.prototype._renderLeftTerminal = function(container, chrSetNumber, chrNumber, position, arm) {

    return {
        offset: position.offset,
        x: position.x
    }
};