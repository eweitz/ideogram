/**
 * Metacentric chromosome view class.
 * @public
 * @class
 * @param {Object} model
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function MetacentricChromosome(model, config, ideo) {

    Chromosome.call(this, model, config, ideo);
}


MetacentricChromosome.prototype = Object.create(Chromosome.prototype);


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
MetacentricChromosome.prototype._renderRightTerminal = function(container, chrSetNumber, chrNumber, position, arm) {

    var self = this;

    var width = this._config.chrWidth;
    var bump  = width / 3.5;

    var band = this._model.bands.filter(function(band) {
        return band.name[0] == arm;
    }).pop();

    var path = container.append('path')
        .attr('d', 'M' + position.x + ',' + width + ' q' + (bump * 2) + ',' + (width / - 2) + ',0,-' + width)
        .attr('class', 'terminal right-terminal ' + band.stain)
        .style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        }).style('stroke', function(d) {
            return self._color.getBorderColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        }).style('stroke-width', 0.5);

    return {
        offset: position.offset + bump,
        x: position.x + bump
    };
};


/**
 * Render chromosome left terminal.
 * @protected
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Object} position
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
MetacentricChromosome.prototype._renderLeftTerminal = function(container, chrSetNumber, chrNumber, position, arm) {

    var self = this;

    var width = this._config.chrWidth;
    var bump  = width / 3.5;

    var band = this._model.bands.find(function(band) {
        return band.name[0] == arm;
    });

    var path = container.append('path')
        .attr('d', 'M' + (position.x + bump) + ',' + width + ' q' + (- bump * 2) + ',' + width / -2 + ',0' + -width)
        .attr('class', 'terminal left-terminal ' + band.stain)
        .style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        }).style('stroke', function(d) {
            return self._color.getBorderColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        }).style('stroke-width', 0.5);

    var dimension = path.node().getBoundingClientRect();

    pathWidth = dimension.width;

    return {
        offset: position.offset + bump,
        x: position.x + bump
    };
};