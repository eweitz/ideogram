function PairedLayout(config, ideo) {
  Layout.call(this, config, ideo);

  this._class = 'PairedLayout';

  this._margin = {
    left: 30
  };
}

PairedLayout.prototype = Object.create(Layout.prototype);

PairedLayout.prototype.rotateForward = function(setNumber, chrNumber,
  chrElement, callback) {
  var self = this;

    // Get ideo container and chromosome set dimensions
  var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
  var chrBox = chrElement.getBoundingClientRect();
    // Evaluate dimensions scale coefficients
  var scaleX = (ideoBox.width / chrBox.height) * 0.97;
  var scaleY = this._getYScale();
    // Evaluate y offset of chromosome. It is different for first and the second one
  var yOffset = setNumber ? 150 : 25;

  var transform =
    'translate(15, ' + yOffset + ') scale(' + scaleX + ', ' + scaleY + ')';

    // Run rotation procedure
  d3.select(chrElement.parentNode)
    .transition()
    .attr("transform", transform)
    .on('end', function() {
        // Run callback function if provided
      if (callback) {
        callback();
      }

      var translateY = (6 * Number(!setNumber));

      // Rotate band labels
      d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
        .attr('transform', 'rotate(90) translate(0, ' + translateY + ')')
        .attr("text-anchor", "middle");

      // Hide syntenic regions
      d3.selectAll('.syntenicRegion').style("display", 'none');
    });

    // Append new chromosome labels
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
    })
    .attr('x', 0)
    .attr('y', yOffset + (self._config.chrWidth * scaleX / 2) * 1.15)
    .style('opacity', 0)
    .text(String)
    .transition()
    .style('opacity', 1);
};

PairedLayout.prototype.rotateBack = function(setNumber, chrNumber, chrElement,
  callback) {
    // Get intial transformation string for chromosome set
  var translate = this.getChromosomeSetTranslate(setNumber);

    // Run rotation procedure
  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", translate)
        .on('end', function() {
            // Run callback fnuction if provided
          callback();
            // Show syntenic regions
          d3.selectAll('.syntenicRegion').style("display", null);
            // Reset changed attributes to original state
          d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
            .attr('transform', null)
            .attr("text-anchor", setNumber ? null : 'end');
        });

  d3.selectAll('g.tmp')
        .style('opacity', 0)
        .remove();
};

PairedLayout.prototype.getHeight = function() {
  return this._config.chrHeight + this._margin.left * 1.5;
};

PairedLayout.prototype.getChromosomeBandTickY1 = function(chrNumber) {
  return chrNumber % 2 ? this._config.chrWidth : this._config.chrWidth * 2;
};

PairedLayout.prototype.getChromosomeBandTickY2 = function(chrNumber) {
  var width = this._config.chrWidth;
  return chrNumber % 2 ? width - this._tickSize : width * 2 + this._tickSize;
};

PairedLayout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {
  return chrNumber % 2 ? null : 'end';
};

PairedLayout.prototype.getChromosomeBandLabelTranslate = function(band,
  chrNumber) {
  var x = chrNumber % 2 ? 10 : -this._config.chrWidth - 10;
  var y = this._ideo.round(band.px.start + band.px.width / 2) + 3;

  return {
    x: y,
    y: y,
    translate: 'rotate(-90) translate(' + x + ', ' + y + ')'
  };
};

PairedLayout.prototype.getChromosomeLabelXPosition = function() {
  return -this._tickSize;
};

PairedLayout.prototype.getChromosomeSetLabelXPosition = function() {
  return this._config.chrWidth / -2;
};

PairedLayout.prototype.getChromosomeSetLabelTranslate = function() {
  return 'rotate(-90)';
};

PairedLayout.prototype.getChromosomeSetTranslate = function(setNumber) {
  var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setNumber);
  return (
    'rotate(90) ' +
    'translate(' + this._margin.left + ', -' + chromosomeSetYTranslate + ')'
  );
};

PairedLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {
  return 200 * (setNumber + 1);
};
