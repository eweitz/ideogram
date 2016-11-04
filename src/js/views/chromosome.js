/**
 * Chromosome view class.
 * @public
 * @class
 * @param {ModelAdapter} adapter
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function Chromosome(adapter, config, ideo) {

    this._adapter = adapter;
    this._model = this._adapter.getModel();
    this._config = config;
    this._ideo = ideo;
    this._color = new Color(this._config);
    this._bumpCoefficient = 5;
}


/**
 * Factory method.
 * @public
 * @static
 * @param {ModelAdapter} adapter
 * @param {Object} config
 * @param {Ideogram} ideo
 * @return {Chromosome}
 */
Chromosome.getInstance = function(adapter, config, ideo) {

    if (adapter.getModel().centromerePosition == 'telocentric') {
        return new TelocentricChromosome(adapter, config, ideo);
    } else {
        return new MetacentricChromosome(adapter, config, ideo);
    }
};


/**
 * @param {String[]} clipPath
 * @param {Boolean} isPArmRendered
 * @returns {String[]}
 */
Chromosome.prototype._addPArmShape = function(clipPath, isPArmRendered) {

    if (isPArmRendered) {
        return clipPath.concat(this._getPArmShape());
    } else {
         return clipPath;
    }
};


/**
 * @param {String[]} clipPath
 * @param {Boolean} isPArmRendered
 * @returns {String[]}
 */
Chromosome.prototype._addQArmShape = function(clipPath, isQArmRendered) {

    if (isQArmRendered) {
        return clipPath.concat(this._getQArmShape());
    } else {
        return clipPath;
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
    var isPArmRendered = this._renderPArm(container, chrSetNumber, chrNumber);
    var isQArmRendered = this._renderQArm(container, chrSetNumber, chrNumber);
    /*
     * Render range set.
     */
    this._renderRangeSet(container, chrSetNumber, chrNumber);
    /*
     * Push arms shape string into clipPath array.
     */
    var clipPath = [];
    clipPath = this._addPArmShape(clipPath, isPArmRendered);
    clipPath = this._addQArmShape(clipPath, isQArmRendered);
    /*
     * Render chromosome border.
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
            return self._color.getBorderColor(chrSetNumber, chrNumber, i);
        }).attr('stroke-width', 1)
        .attr('d', function(d) {
            return d.path;
        }).attr('class', function(d) {
            return d['class'];
        });

    return clipPath;
};


/**
 * 
 */
Chromosome.prototype._renderRangeSet = function(container, chrSetNumber, chrNumber) {

    if (! ('rangeSet' in this._config)) {
        return;
    };

    var rangeSet = this._config.rangeSet.filter(function(range) {
        return range.chr == chrSetNumber;
    }).map(function(range) {
        return new Range(range);
    });

//    console.log(chrSetNumber, ranges.length)
    var rangesContainer = container.append('g')
        .attr('class', 'range-set');

    var self = this;
    rangesContainer.selectAll('rect.range')
        .data(rangeSet)
        .enter()
        .append('rect')
        .attr('class', 'range')
        .attr('x', function(range) {
            return self._ideo.convertBpToPx(self._model, range.getStart());
        }).attr('y', 0)
        .attr('width', function(range) {
            return self._ideo.convertBpToPx(self._model, range.getLength());
        }).attr('height', this._config.chrWidth)
        .style('fill', function(range) {
            return range.getColor(chrNumber);
        });
};


/**
 * Get chromosome's shape main values.
 * @returns {Object}
 */
Chromosome.prototype._getShapeData = function() {
    /*
     * First q band from bands sequence.
     */
    var firstQBand;
    for (var i = 0; i < this._model.bands.length; i ++) {
        if (this._model.bands[i].name[0] == 'q') {
            firstQBand = this._model.bands[i];
            break;
        }
    }
    /*
     * Chromosome's right position.
     */
    var rightTerminalPosition = this._model.bands[this._model.bands.length - 1].px.stop;
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
        x2 : firstQBand ? firstQBand.px.start : rightTerminalPosition,
        x3 : rightTerminalPosition,
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
 * @param {Object[]} bands
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

            var start = self._ideo.round(d.px.start);
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
 * Returns boolean which indicates is any bands was rendered.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @return {Boolean}
 */
Chromosome.prototype._renderPArm = function(container, chrSetNumber, chrNumber) {

    var bands = this._model.bands.filter(function(band) {
        return band.name[0] == 'p';
    });

    this._renderBands(container, chrSetNumber, chrNumber, bands, 'p');

    return Boolean(bands.length);
};


/**
 * Render chromosome's q arm.
 * Returns boolean which indicates is any bands was rendered.
 * @private
 * @param {Selection} container
 * @param {Integer} chrSetNumber
 * @param {Integer} chrNumber
 * @return {Boolean}
 */
Chromosome.prototype._renderQArm = function(container, chrSetNumber, chrNumber) {

    var bands = this._model.bands.filter(function(band) {
        return band.name[0] == 'q';
    });

    this._renderBands(container, chrSetNumber, chrNumber, bands, 'q');

    return Boolean(bands.length);
};