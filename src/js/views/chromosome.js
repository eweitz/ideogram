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
    this._bumpCoefficient = 5;
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
};


/**
 * Render chromosome.
 * @public
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @return {String[]}
 */
Chromosome.prototype.render = function(container, chrSetNumber, chrNumber) {
    /*
     * Append bands container and apply clip-path on it.
     */
    container = container.append('g')
        .attr('class', 'bands')
        .attr("clip-path", "url(#" + this._model.id + "-chromosome-set-clippath)")
    /*
     * Render chromosome arms.
     */
    this._renderPArm(container, chrSetNumber, chrNumber);
    this._renderQArm(container, chrSetNumber, chrNumber);
    /*
     * Push p arm shape string path.
     */
    var clipPath = [];
    clipPath = clipPath.concat(this._getPArmShape());
    clipPath = clipPath.concat(this._getQArmShape());
    /*
     * Render shapes.
     */
    var self = this;
    container.append('g')
        .attr('class', 'chromosome-border')
        .selectAll('path')
        .data(clipPath)
        .enter()
        .append('path')
        .attr('fill', 'transparent')
        .attr('stroke', function(d, i) {
            return self._ideo._color.getBorderColor(chrSetNumber, chrNumber, i);
        }).attr('stroke-width', 1)
        .attr('d', function(d) {
            return d.path;
        }).attr('class', function(d) {
            return d['class'];
        });

    return clipPath;
};


/**
 * Get chromosome's shape main values.
 * @returns {Object}
 */
Chromosome.prototype._getShapeData = function() {
    /*
     * Properties description.
     * x1 - left terminal start position
     * x2 - centromere position
     * x3 - right terminal end position
     * w - chromosome width
     * b - bump size
     */
    return {
        x1 : 0,
        x2 : this._model.bands.find(function(band) {
                return band.name[0] == 'q';
            }).px.start,
        x3 : this._model.bands[this._model.bands.length - 1].px.stop,
        w : this._config.chrWidth,
        b : this._config.chrWidth / this._bumpCoefficient
    };
};


Chromosome.prototype._getPArmShape = function() {

    var d = this._getShapeData();

    return {
        'class' : '',
        'path' : 'M' + d.b + ',0 ' +
            'L' + (d.x2 - d.b) + ',0 ' +
            'Q' + (d.x2 + d.b) + ',' + (d.w / 2) + ',' + (d.x2 - d.b) + ',' + d.w + ' ' +
            'L' + d.b + ',' + d.w + ' ' +
            'Q-' + d.b + ',' + (d.w / 2) + ',' + d.b + ',0'
    };
};


Chromosome.prototype._getQArmShape = function() {

    var d = this._getShapeData();

    return {
        'class' : '',
        'path' : 'M' + (d.x2 + d.b) + ',0 ' +
            'L' + (d.x3 - d.b) + ',0 ' +
            'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + (d.x3 - d.b) + ',' + d.w + ' ' +
            'L' + (d.x2 + d.b) + ',' + d.w + ' ' +
            'Q' + (d.x2 - d.b) + ',' + (d.w / 2) + ',' + (d.x2 + d.b) + ',0'
    };
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
Chromosome.prototype._renderBands = function(container, chrSetNumber, chrNumber, bands, arm) {

    var self = this;

    container.selectAll("path.band." + arm)
        .data(bands)
        .enter()
        .append("path")
        .attr("id", function(d, i) {
            return self._model.id + "-" + d.name.replace(".", "-");
        }).attr("class", function(d, i) {
            return 'band ' + arm + '-band ' + d.stain;
        }).attr("d", function(d, i) {

            var start = self._ideo.round(d.px.start);// + position.offset;
            var length = self._ideo.round(d.px.width);

            x = start + length;

            return "M " + start + ", 0" +
                "l " + length + " 0 " +
                "l 0 " + self._config.chrWidth + " " +
                "l -" + length + " 0 z";
        }).style('fill', function(d) {
            return self._color.getArmColor(chrSetNumber, chrNumber, arm == 'p' ? 0 : 1);
        });
};


/**
 * Render chromosome's p arm.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 */
Chromosome.prototype._renderPArm = function(container, chrSetNumber, chrNumber) {

    var bands = this._model.bands.filter(function(band) {
        return band.name[0] == 'p';
    });

    this._renderBands(container, chrSetNumber, chrNumber, bands, 'p');
};


/**
 * Render chromosome's q arm.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 */
Chromosome.prototype._renderQArm = function(container, chrSetNumber, chrNumber) {

    var bands = this._model.bands.filter(function(band) {
        return band.name[0] == 'q';
    });

    this._renderBands(container, chrSetNumber, chrNumber, bands, 'q');
};