/**
 * 
 */
function TelocentricChromosome(model, config, ideo) {

    Chromosome.call(this, model, config, ideo);
    this._class = 'TelocentricChromosome';
}


TelocentricChromosome.prototype = Object.create(Chromosome.prototype);


/**
 * Render chromosome right terminal.
 * @protected
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Number} x
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
TelocentricChromosome.prototype._renderRightTerminal = function(container, chrSetNumber, chrNumber, x, arm) {

    if (arm == 'p') {
        return this._renderTelocentricRightTerminal(container, chrSetNumber, chrNumber, x, arm);
    } else {
        return this._renderMetacentricRightTerminal(container, chrSetNumber, chrNumber, x, arm);
    }
};


/**
 * Render chromosome right telocentric terminal.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Number} x
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
TelocentricChromosome.prototype._renderTelocentricRightTerminal = function(container, chrSetNumber, chrNumber, x, arm) {

    var width = this._ideo.config.chrWidth;

    container.append('path')
        .attr('class', 'band acen')
        .attr('d', 'M1,1 L6,1 L6,' + (width - 1) + ' L1,' + (width - 1) + ' Z')
        .style('stroke', 'black')
        .style('stroke-width', 0.5);

    container.append('line')
        .attr('x1', 1)
        .attr('y1', 0)
        .attr('x2', 1)
        .attr('y2', width)
        .style('stroke', 'black')
        .style('stroke-width', 2);

    return 1.5;
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
 * @param {Number} x
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
TelocentricChromosome.prototype._renderLeftTerminal = function(container, chrSetNumber, chrNumber, x, arm) {

    return x;
};