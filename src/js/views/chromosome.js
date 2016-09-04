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
 * @param {Number} x
 * @param {'p'|'q'} arm
 * @returns {Number}
 */
Chromosome.prototype._renderBands = function(container, chrSetNumber, chrNumber, x, arm) {

    var self = this;
    var offset = x;

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

            var start = self._ideo.round(d.px.start) + x;
            var length = self._ideo.round(d.px.width);

            offset = start + length;

            return "M " + start + ", 0" +
                "l " + length + " 0 " +
                "l 0 " + self._config.chrWidth + " " +
                "l -" + length + " 0 z";
        }).style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        });

    return offset;
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

    var width = this._renderLeftTerminal(container, chrSetNumber, chrNumber, 0, 'p');

    var offset = this._renderBands(container, chrSetNumber, chrNumber, width, 'p');

    return this._renderRightTerminal(container, chrSetNumber, chrNumber, offset, 'p');
};


/**
 * Render chromosome's q arm.
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @param {Number} x
 * @returns {Number}
 */
Chromosome.prototype._renderQArm = function(container, chrSetNumber, chrNumber, x) {

    var width = this._renderLeftTerminal(container, chrSetNumber, chrNumber, x, 'q');

    var offset = this._renderBands(container, chrSetNumber, chrNumber, width * 2, 'q');

    return this._renderRightTerminal(container, chrSetNumber, chrNumber, offset, 'q');
};