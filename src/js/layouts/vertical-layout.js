
function VerticalLayout(config, ideo) {
    Layout.call(this, config, ideo);
    this._class = 'VerticalLayout';
    // Layout margins
    this._margin = {
        top: 30,
        left: 15
    };
}


VerticalLayout.prototype = Object.create(Layout.prototype);


VerticalLayout.prototype.rotateForward = function(setNumber, chrNumber, chrElement, callback) {

    var self = this;

    var xOffset = 20;

    var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
    var chrBox = chrElement.getBoundingClientRect();

    var scaleX = (ideoBox.width / chrBox.height) * 0.97;
    var scaleY = this._getYScale();

    var transform = "translate(" + xOffset + ", 25) scale(" + scaleX + ", " + scaleY + ")";

    d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", transform)
        .on('end', callback);

    // Append new chromosome labels
    var labels = this.getChromosomeLabels(chrElement);
    d3.select(this._ideo.getSvg())
        .append('g')
        .attr('class', 'tmp')
        .selectAll('text')
        .data(labels)
        .enter()
        .append('text')
        .attr('class', function(d, i) {
            return i === 0 && labels.length === 2 ? 'chrSetLabel' : null;
        }).attr('x', function(d, i) {
            return 0;
        }).attr('y', function(d, i) {
            return (xOffset + self._config.chrWidth) * 1.3;
        }).style('opacity', 0)
        .text(String)
        .transition()
        .style('opacity', 1);
};


VerticalLayout.prototype.rotateBack = function(setNumber, chrNumber, chrElement, callback) {

    var translate = this.getChromosomeSetTranslate(setNumber);

    d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", translate)
        .on('end', callback);

    d3.selectAll('g.tmp')
        .style('opacity', 0)
        .remove();
};


VerticalLayout.prototype.getHeight = function(taxId) {

    return this._config.chrHeight + this._margin.top * 1.5;
};


VerticalLayout.prototype.getChromosomeBandLabelTranslate = function(band) {

};


VerticalLayout.prototype.getChromosomeSetLabelTranslate = function() {

    return 'rotate(-90)';
};


VerticalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {

    return 'rotate(90) translate(' + this._margin.top + ', -' + this.getChromosomeSetYTranslate(setNumber) + ')';
};


VerticalLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {
    // Get additional padding caused by annotation/histogram tracks
    var additionalPadding = this._getAdditionalOffset();
    // If no detailed description provided just use one formula for all cases
    if (! this._config.ploidyDesc) {

         // TODO:
         // This part of code contains a lot magic numbers and if
         // statements for exactly corresponing to original ideogram examples.
         // But all this stuff should be removed. Calculation of translate
         // should be a simple formula applied for all cases listed below.
         // Now they are diffirent because of Layout:_getAdditionalOffset do
         // not meet for cases when no annotation, when annotation exists and
         // when histogram used
        var translate;
        if (this._config.annotationsLayout === "histogram") {
            translate = this._config.chrMargin / 2 + setNumber * (this._config.chrMargin + this._config.chrWidth + 2) + additionalPadding * 2 + 1;
        } else if (additionalPadding > 0) {
            translate = this._config.chrWidth + setNumber * (this._config.chrMargin + this._config.chrWidth) + additionalPadding * 2;
        } else {
            translate = this._config.chrWidth + setNumber * (this._config.chrMargin + this._config.chrWidth) + additionalPadding * 2 + 4 + (2 * setNumber);
        }

        return translate;
    }

    // If detailed description provided start to calculate offsets
    // for each chromosome set separately. This should be done only once
    if (! this._translate) {
        // First offset equals to zero
        this._translate = [this._ploidy.getSetSize(0) * this._config.chrWidth * 2];
        // Loop through description set
        for (var i = 1; i < this._config.ploidyDesc.length; i ++) {
            this._translate[i] = this._translate[i - 1] + this._getChromosomeSetSize(i - 1);
        }
    }

    return this._translate[setNumber];
};


VerticalLayout.prototype.getChromosomeSetLabelXPosition = function(setNumber) {

    return this._config.chrWidth / -2;
};


VerticalLayout.prototype.getChromosomeLabelXPosition = function(i) {

    return this._config.chrWidth / - 2;
};
