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
 * @param {Number} x
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
MetacentricChromosome.prototype._renderRightTerminal = function(container, chrSetNumber, chrNumber, x, arm) {

    var self = this;

    var width = this._ideo.config.chrWidth;

    var band = this._model.bands.filter(function(band) {
        return band.name[0] == arm;
    }).pop();

    var path = container.append('path')
        .attr('d', 'M' + x + ',' + width + ' Q' + (x + width / 2) + ',' + width / 2 + ',' + x + ',0')
        .attr('class', 'right-' + arm + '-terminal ' + band.stain)
        .style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        });

    var dimension = path.node().getBoundingClientRect();

    return x;
};


/**
 * Render chromosome left terminal.
 * @protected
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Number} x
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
MetacentricChromosome.prototype._renderLeftTerminal = function(container, chrSetNumber, chrNumber, x, arm) {

    var self = this;

    var width = this._ideo.config.chrWidth;

    var band = this._model.bands.find(function(band) {
        return band.name[0] == arm;
    });

    var path = container.append('path')
        .attr('d', 'M' + width + ',' + width + ' Q' + width / 2 + ',' + width / 2 + ',' + width + ',0')
        .attr('class', 'left-' + arm + '-terminal ' + band.stain)
        .style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        });

    var dimension = path.node().getBoundingClientRect();

    pathWidth = dimension.width;

    path.attr('d', 'M' + (pathWidth + x) + ',' + width + ' Q' + x + ',' + width / 2 + ',' + (pathWidth + x) + ',0');

    return pathWidth;
};