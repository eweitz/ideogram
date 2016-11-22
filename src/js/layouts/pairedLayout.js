/**
 * @public
 * @class
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function PairedLayout(config, ideo) {
    /*
     * 
     */
    Layout.call(this, config, ideo);
    /**
     * @private
     * @member {String}
     */
    this._class = 'PairedLayout';
    /**
     * Layout margins.
     * @private
     * @member {Object}
     */
    this._margin = {
        left : 30
    };
}


PairedLayout.prototype = Object.create(Layout.prototype);


/**
 * @override
 */
PairedLayout.prototype.rotateForward = function(setNumber, chrNumber, chrElement, callback) {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Get ideo container and chromosome set dimensions.
     */
    var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
    var chrBox = chrElement.getBoundingClientRect();
    /*
     * Evaluate dimensions scale coefficients.
     */
    var scaleX = (ideoBox.width / chrBox.height) * 0.97;
    var scaleY = this._getYScale();
    /*
     * Evaluate y offset of chromosome. It is different for first and the second one.
     */
    var yOffset = setNumber ? 150 : 25;
    /*
     * Define transformation string
     */
    var transform = 'translate(15, ' + yOffset + ') scale(' + scaleX + ', ' + scaleY + ')';
    /*
     * Run rotation procedure.
     */
    d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", transform)
        .on('end', function() {
            /*
             * Run callback fnuction if provided.
             */
            if (callback) {
                callback();
            }
            /*
             * Rotate band labels.
             */
            d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
                .attr('transform', 'rotate(90) translate(0, ' + (6 * Number(! setNumber)) + ')')
                .attr("text-anchor", "middle");
            /*
             * Hide syntenic regions.
             */
            d3.selectAll('.syntenicRegion').style("display", 'none');
        });
    /*
     * Append new chromosome labels.
     */
    var labels = this.getChromosomeLabels(chrElement);
    d3.select(this._ideo.getSvg())
        .append('g')
        .attr('class', 'tmp')
        .selectAll('text')
        .data(this.getChromosomeLabels(chrElement))
        .enter()
        .append('text')
        .attr('class', function(d, i) {
            return i === 0 && labels.length === 2 ? 'chrSetLabel' : null;
        }).attr('x', function(d, i) {
            return 0;
        }).attr('y', function(d, i) {
            return yOffset + (self._config.chrWidth * scaleX / 2) * 1.15;
        }).style('opacity', 0)
        .text(String)
        .transition()
        .style('opacity', 1);
};


/**
 * @override
 */
PairedLayout.prototype.rotateBack = function(setNumber, chrNumber, chrElement, callback) {
    /*
     * Get intial transformation string for chromosome set.
     */
    var translate = this.getChromosomeSetTranslate(setNumber);
    /*
     * Run rotation procedure.
     */
    d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", translate)
        .on('end', function() {
            /*
             * Run callback fnuction if provided.
             */
            callback();
            /*
             * Show syntenic regions.
             */
            d3.selectAll('.syntenicRegion').style("display", null);
            /*
             * Reset changed attributes to original state.
             */
            d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
                .attr('transform', null)
                .attr("text-anchor", setNumber ? null : 'end');
        });

    d3.selectAll('g.tmp')
        .style('opacity', 0)
        .remove();
};


/**
 * @override
 */
PairedLayout.prototype.getHeight = function(taxId) {

    return this._config.chrHeight + this._margin.left * 1.5;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandTickY1 = function(chrNumber) {

    return chrNumber % 2 ? this._config.chrWidth : this._config.chrWidth * 2;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandTickY2 = function(chrNumber) {

    return chrNumber % 2 ? this._config.chrWidth - this._tickSize : this._config.chrWidth * 2 + this._tickSize;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {

    return chrNumber % 2 ? null : 'end';
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeBandLabelTranslate = function(band, chrNumber) {

    var x = chrNumber % 2 ? 10 : - this._config.chrWidth - 10;
    var y = this._ideo.round(band.px.start + band.px.width / 2) + 3;

    return {
        x : y,
        y : y,
        translate : 'rotate(-90) translate(' + x + ', ' + y + ')'
    };
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return - this._tickSize;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetLabelXPosition = function(i) {

    return this._config.chrWidth / - 2;
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return 'rotate(-90)';
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return 'rotate(90) translate(' + this._margin.left + ', -' + this.getChromosomeSetYTranslate(setNumber) + ')';
};


/**
 * @override
 */
PairedLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {

    return 200 * (setNumber + 1);
};