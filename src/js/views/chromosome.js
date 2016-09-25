/**
 * Chromosome view class.
 * @public
 * @class
 * @param {Object} model
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function Chromosome(model, config, ideo) {

    this._model = model;
    this._config = config;
    this._ideo = ideo;
    this._color = new Color(this._config);
    this._currentArm = undefined;
    this._width = this._config.chrWidth;
    this._bump = this._width / 3.5;
}


/**
 * Factory method.
 * @public
 * @static
 * @param {Object} model
 * @param {Object} config
 * @param {Ideogram} ideo
 * @return {Chromosome}
 */
Chromosome.getInstance = function(model, config, ideo) {

    if (model.centromerePosition == 'telocentric') {
        return new TelocentricChromosome(model, config, ideo);
    } else {
        return new MetacentricChromosome(model, config, ideo);
    }
}


/**
 * Render chromosome.
 * @public
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 */
Chromosome.prototype.render = function(container, chrSetNumber, chrNumber) {

    var offset = this._renderPArm(container, chrSetNumber, chrNumber);
    this._renderQArm(container, chrSetNumber, chrNumber, offset);
};


/**
 * Render arm bands.
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Object} position
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
Chromosome.prototype._renderBands = function(container, chrSetNumber, chrNumber, position, arm) {

    var self = this;

    var x = position.x;

    container.selectAll("path.band." + arm)
        .data(self._model.bands.filter(function(band) {
            return band.name[0] == arm;
        })).enter()
        .append("path")
        .attr("id", function(d, i) {
            return self._model.id + "-" + d.name.replace(".", "-");
        }).attr("class", function(d, i) {
            return 'band ' + arm + '-band ' + d.stain;
        }).attr("d", function(d, i) {

            var start = self._ideo.round(d.px.start) + position.offset;
            var length = self._ideo.round(d.px.width);

            x = start + length;

            return "M " + start + ", 0" +
                "l " + length + " 0 " +
                "l 0 " + self._config.chrWidth + " " +
                "l -" + length + " 0 z";
        }).style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        });

    return {
        offset: position.offset,
        x: x
    };
};


/**
 * Render chromosome's p arm.
 * @public
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @returns {Number}
 */
Chromosome.prototype._renderPArm = function(container, chrSetNumber, chrNumber) {

    var position = {
        offset: 0,
        x: 0
    };

    position = this._renderLeftTerminal(container, chrSetNumber, chrNumber, position, 'p');
    start = position.offset;

    position = this._renderBands(container, chrSetNumber, chrNumber, position, 'p');
    stop = position.x;

    this._renderBorder(container, chrSetNumber, chrNumber, 'p', start, stop);

    return this._renderRightTerminal(container, chrSetNumber, chrNumber, position, 'p');
};


/**
 * Render chromosome's q arm.
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Object} x
 * @returns {Number}
 */
Chromosome.prototype._renderQArm = function(container, chrSetNumber, chrNumber, position) {

    var position = this._renderLeftTerminal(container, chrSetNumber, chrNumber, position, 'q');
    start = position.x;

    position = this._renderBands(container, chrSetNumber, chrNumber, position, 'q');
    stop = position.x;

    this._renderBorder(container, chrSetNumber, chrNumber, 'q', start, stop);

    return this._renderRightTerminal(container, chrSetNumber, chrNumber, position, 'q');
};


Chromosome.prototype._renderBorder = function(container, chrSetNumber, chrNumber, arm, from, to) {

    container.append('line')
        .attr('x1', from)
        .attr('y1', 0)
        .attr('x2', to)
        .attr('y2', 0)
        .style('stroke', this._color.getBorderColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1))
        .style('stroke-width', 0.5);
    container.append('line')
        .attr('x1', from)
        .attr('y1', this._config.chrWidth)
        .attr('x2', to)
        .attr('y2', this._config.chrWidth)
        .style('stroke', this._color.getBorderColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1))
        .style('stroke-width', 0.5);
};