/**
 * Chromosome range.
 * @public
 * @class
 * @param {Object} data - range data.
 * @param {Integer} data.chr - chromosome index.
 * @param {Integer[]} [data.ploidy] - array which controls on which chromosomes range should appear in case of ploidy.
 * @param {Integer} data.start - range start.
 * @param {Integer} data.stop - range end.
 * @param {String} data.color - range color.
 */
function Range(data) {
  this._data = data;
}

Range.prototype.getStart = function() {
  return this._data.start;
};

Range.prototype.getStop = function() {
  return this._data.stop;
};

Range.prototype.getLength = function() {
  return this._data.stop - this._data.start;
};

Range.prototype.getColor = function(chrNumber) {
  if (!('ploidy' in this._data)) {
    return this._getColor(chrNumber);
  } else if ('ploidy' in this._data && this._data.ploidy[chrNumber]) {
    return this._getColor(chrNumber);
  } else {
    return 'transparent';
  }
};

Range.prototype._getColor = function(chrNumber) {
  if (Array.isArray(this._data.color)) {
    return this._data.color[chrNumber];
  } else {
    return this._data.color;
  }
};

function ModelAdapter(model) {
  this._model = model;
  this._class = 'ModelAdapter';
}

ModelAdapter.getInstance = function(model) {
  if (model.bands) {
    return new ModelAdapter(model);
  } else {
    return new ModelNoBandsAdapter(model);
  }
};

ModelAdapter.prototype.getModel = function() {
  return this._model;
};

ModelAdapter.prototype.getCssClass = function() {
  return '';
};

function ModelNoBandsAdapter(model) {
    /*
     * Call parent constructor.
     */
  ModelAdapter.call(this, model);
  this._class = 'ModelNoBandsAdapter';
}

ModelNoBandsAdapter.prototype = Object.create(ModelAdapter.prototype);

ModelNoBandsAdapter.prototype.getModel = function() {
  this._model.bands = [];

    // If chromosome width more, then 1 add single band to bands array
  if (this._model.width > 1) {
    this._model.bands.push({
      name: 'p',
      px: {
        start: 0,
        stop: this._model.width,
        width: this._model.width
      }
    });
  }

  return this._model;
};

ModelNoBandsAdapter.prototype.getCssClass = function() {
  return 'noBands';
};

function Layout(config, ideo) {
  this._config = config;
  this._ideo = ideo;
  this._ploidy = this._ideo._ploidy;
  this._translate = undefined;

     // Chromosome band's size.
  this._tickSize = 8;

    // Chromosome rotation state.
  this._isRotated = false;
}

// Factory method
Layout.getInstance = function(config, ideo) {
  if ("perspective" in config && config.perspective == "comparative") {
    return new PairedLayout(config, ideo);
  } else if ("rows" in config && config.rows > 1) {
    return new SmallLayout(config, ideo);
  } else if (config.orientation === 'vertical') {
    return new VerticalLayout(config, ideo);
  } else if (config.orientation === 'horizontal') {
    return new HorizontalLayout(config, ideo);
  } else {
    return new VerticalLayout(config, ideo);
  }
};

// Get chart left margin
Layout.prototype._getLeftMargin = function() {
  return this._margin.left;
};

// Get rotated chromosome y scale
Layout.prototype._getYScale = function() {
    // 20 is width of rotated chromosome.
  return 20 / this._config.chrWidth;
};

// Get chromosome labels
Layout.prototype.getChromosomeLabels = function(chrElement) {
  var util = new ChromosomeUtil(chrElement);

  return [util.getSetLabel(), util.getLabel()].filter(function(d) {
    return d.length > 0;
  });
};

// Rotate chromosome to original position
Layout.prototype.rotateBack = function(chrSetNumber, chrNumber, chrElement, callback) {
  throw new Error(this._class + '#rotateBack not implemented');
};

// Rotate chromosome to opposite position
Layout.prototype.rotateForward = function(chrSetNumber, chrNumber, chrElement, callback) {
  throw new Error(this._class + '#rotateForward not implemented');
};

Layout.prototype.rotate = function(chrSetNumber, chrNumber, chrElement) {
    // Find chromosomes which should be hidden
  var otherChrs = d3.selectAll("g.chromosome").filter(function(d, i) {
    return this !== chrElement;
  });

  if (this._isRotated) {
        // Reset _isRotated flag
    this._isRotated = false;
        // Rotate chromosome back
    this.rotateBack(chrSetNumber, chrNumber, chrElement, function() {
            // Show all other chromosomes and chromosome labels
      otherChrs.style("display", null);
      d3.selectAll(".chrSetLabel, .chrLabel").style("display", null);
    });
  } else {
        // Set _isRotated flag
    this._isRotated = true;

        // Hide all other chromosomes and chromosome labels
    otherChrs.style("display", "none");
    d3.selectAll(".chrSetLabel, .chrLabel").style("display", "none");

        // Rotate chromosome
    this.rotateForward(chrSetNumber, chrNumber, chrElement);
  }
};

Layout.prototype.getChromosomeLabelClass = function() {
  if (this._config.ploidy === 1) {
    return 'chrLabel';
  } else {
    return 'chrSetLabel';
  }
};

Layout.prototype._getAdditionalOffset = function() {
  return (this._config.annotationHeight || 0) * (this._config.numAnnotTracks || 1);
};

Layout.prototype._getChromosomeSetSize = function(chrSetNumber) {
    // Get last chromosome set size.
  var setSize = this._ploidy.getSetSize(chrSetNumber);

    // Increase offset by last chromosome set size
  return setSize * this._config.chrWidth * 2 + (this._config.ploidy > 1 ? 20 : 0);
};

// Get layout margin
Layout.prototype.getMargin = function() {
  return this._margin;
};

// Get SVG element height
Layout.prototype.getHeight = function(taxId) {
  throw new Error(this._class + '#getHeight not implemented');
};

Layout.prototype.getChromosomeBandTickY1 = function(chrNumber) {
  throw new Error(this._class + '#getChromosomeBandTickY1 not implemented');
};

Layout.prototype.getChromosomeBandTickY2 = function(chrNumber) {
  throw new Error(this._class + '#getChromosomeBandTickY2 not implemented');
};

// Get chromosome's band translate attribute
Layout.prototype.getChromosomeBandLabelTranslate = function(band, chrNumber) {
  throw new Error(this._class + '#getChromosomeBandLabelTranslate not implemented');
};

// Get chromosome set label anchor property
Layout.prototype.getChromosomeSetLabelAnchor = function() {
  return 'middle';
};

// Get chromosome's band label text-anchor value
Layout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {
  throw new Error(this._class + '#getChromosomeBandLabelAnchor not implemented');
};

Layout.prototype.getChromosomeLabelXPosition = function(i) {
  throw new Error(this._class + '#getChromosomeLabelXPosition not implemented');
};

// Get chromosome label y position. "i" is chromosome number
Layout.prototype.getChromosomeLabelYPosition = function(i) {
  return -5.5;
};

Layout.prototype.getChromosomeSetLabelYPosition = function(i) {
  if (this._config.ploidy === 1) {
    return this.getChromosomeLabelYPosition(i);
  } else {
    return -2 * this._config.chrWidth;
  }
};

Layout.prototype.getChromosomeSetLabelXPosition = function(i) {
  throw new Error(this._class + '#getChromosomeSetLabelXPosition not implemented');
};

Layout.prototype.getChromosomeSetLabelTranslate = function() {
  throw new Error(this._class + '#getChromosomeSetLabelTranslate not implemented');
};

// Get chromosome set translate attribute.
Layout.prototype.getChromosomeSetTranslate = function(setNumber) {
  throw new Error(this._class + '#getChromosomeSetTranslate not implemented');
};

// Get chromosome set translate's y offset
Layout.prototype.getChromosomeSetYTranslate = function(setNumber) {
  throw new Error(this._class + '#getChromosomeSetYTranslate not implemented');
};

function HorizontalLayout(config, ideo) {
  Layout.call(this, config, ideo);
  this._class = 'HorizontalLayout';
  this._margin = {
    left: 20,
    top: 30
  };
}

HorizontalLayout.prototype = Object.create(Layout.prototype);

HorizontalLayout.prototype._getLeftMargin = function() {
  var margin = Layout.prototype._getLeftMargin.call(this);
  if (this._config.ploidy > 1) {
    margin *= 1.8;
  }

  return margin;
};

HorizontalLayout.prototype.rotateForward = function(setNumber, chrNumber, chrElement, callback) {
  var self = this;

  var xOffset = 30;

  var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
  var chrBox = chrElement.getBoundingClientRect();

  var scaleX = (ideoBox.height / (chrBox.width + xOffset / 2)) * 0.9;
  var scaleY = this._getYScale();

  var yOffset = (chrNumber + 1) * ((this._config.chrWidth * 2) * scaleY);

  var transform = 'rotate(90) translate(' + xOffset + ', -' + yOffset + ') scale(' + scaleX + ', ' + scaleY + ')';

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
          return 30;
        }).attr('y', function(d, i) {
          return (i + 1 + labels.length % 2) * 12;
        }).style('text-anchor', 'middle')
        .style('opacity', 0)
        .text(String)
        .transition()
        .style('opacity', 1);
};

HorizontalLayout.prototype.rotateBack = function(setNumber, chrNumber, chrElement, callback) {
  var translate = this.getChromosomeSetTranslate(setNumber);

  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", translate)
        .on('end', callback);

  d3.selectAll('g.tmp')
        .style('opacity', 0)
        .remove();
};

HorizontalLayout.prototype.getHeight = function(taxId) {
    // Get last chromosome set offset.
  var lastSetOffset = this.getChromosomeSetYTranslate(this._config.chromosomes[taxId].length - 1);

    // Get last chromosome set size.
  var lastSetSize = this._getChromosomeSetSize(this._config.chromosomes[taxId].length - 1);

    // Increase offset by last chromosome set size
  lastSetOffset += lastSetSize;

  return lastSetOffset + this._getAdditionalOffset() * 2;
};

HorizontalLayout.prototype.getChromosomeSetLabelAnchor = function() {
  return 'end';
};

HorizontalLayout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {
  return null;
};

HorizontalLayout.prototype.getChromosomeBandTickY1 = function(chrNumber) {
  return 2;
};

HorizontalLayout.prototype.getChromosomeBandTickY2 = function(chrNumber) {
  return 10;
};

HorizontalLayout.prototype.getChromosomeBandLabelTranslate = function(band) {
  var x = this._ideo.round(-this._tickSize + band.px.start + band.px.width / 2);
  var y = -10;

  return {
    x: x,
    y: y,
    translate: 'translate(' + x + ',' + y + ')'
  };
};

HorizontalLayout.prototype.getChromosomeSetLabelTranslate = function() {
  return null;
};

HorizontalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {
  return "translate(" + this._getLeftMargin() + ", " + this.getChromosomeSetYTranslate(setNumber) + ")";
};

HorizontalLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {
    // If no detailed description provided just use one formula for all cases.
  if (!this._config.ploidyDesc) {
    return this._config.chrMargin * (setNumber + 1);
  }

    // Id detailed description provided start to calculate offsets
    //  for each chromosome set separately. This should be done only once.
  if (!this._translate) {
        // First offset equals to zero.
    this._translate = [1];

        // Loop through description set
    for (var i = 1; i < this._config.ploidyDesc.length; i++) {
      this._translate[i] = this._translate[i - 1] + this._getChromosomeSetSize(i - 1);
    }
  }

  return this._translate[setNumber];
};

HorizontalLayout.prototype.getChromosomeSetLabelXPosition = function(i) {
  if (this._config.ploidy === 1) {
    return this.getChromosomeLabelXPosition(i);
  } else {
    return -20;
  }
};

HorizontalLayout.prototype.getChromosomeSetLabelYPosition = function(i) {
  if (this._config.ploidy === 1) {
    return (this._ploidy.getSetSize(i) * this._config.chrWidth) / 2 + 3;
  } else {
    return this._ploidy.getSetSize(i) * this._config.chrWidth;
  }
};

HorizontalLayout.prototype.getChromosomeLabelXPosition = function(i) {
  return -8;
};

HorizontalLayout.prototype.getChromosomeLabelYPosition = function(i) {
  return this._config.chrWidth;
};


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

VerticalLayout.prototype.rotateForward = function(setNumber, chrNumber,
  chrElement, callback) {
  var self = this;

  var xOffset = 20;

  var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
  var chrBox = chrElement.getBoundingClientRect();

  var scaleX = (ideoBox.width / chrBox.height) * 0.97;
  var scaleY = this._getYScale();

  var transform =
    "translate(" + xOffset + ", 25) scale(" + scaleX + ", " + scaleY + ")";

  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", transform)
        .on('end', callback);

    // Append new chromosome labels
  var labels = this.getChromosomeLabels(chrElement);
  var y = (xOffset + self._config.chrWidth) * 1.3;
  d3.select(this._ideo.getSvg())
    .append('g')
    .attr('class', 'tmp')
    .selectAll('text')
    .data(labels)
    .enter()
    .append('text')
    .attr('class', function(d, i) {
      return i === 0 && labels.length === 2 ? 'chrSetLabel' : null;
    })
    .attr('x', 0)
    .attr('y', y).style('opacity', 0)
    .text(String)
    .transition()
    .style('opacity', 1);
};

VerticalLayout.prototype.rotateBack = function(setNumber, chrNumber,
  chrElement, callback) {
  var translate = this.getChromosomeSetTranslate(setNumber);

  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", translate)
        .on('end', callback);

  d3.selectAll('g.tmp')
        .style('opacity', 0)
        .remove();
};

VerticalLayout.prototype.getHeight = function() {
  return this._config.chrHeight + this._margin.top * 1.5;
};

VerticalLayout.prototype.getChromosomeBandLabelTranslate = function() {

};

VerticalLayout.prototype.getChromosomeSetLabelTranslate = function() {
  return 'rotate(-90)';
};

VerticalLayout.prototype.getChromosomeSetTranslate = function(setNumber) {
  var marginTop = this._margin.top;
  var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setNumber);
  return (
    'rotate(90) ' +
    'translate(' + marginTop + ', -' + chromosomeSetYTranslate + ')'
  );
};

VerticalLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {
    // Get additional padding caused by annotation/histogram tracks
  var pad = this._getAdditionalOffset(),
    margin = this._config.chrMargin,
    width = this._config.chrWidth,
    translate;

    // If no detailed description provided just use one formula for all cases
  if (!this._config.ploidyDesc) {
   // TODO:
   // This part of code contains a lot magic numbers and if
   // statements for exactly corresponing to original ideogram examples.
   // But all this stuff should be removed. Calculation of translate
   // should be a simple formula applied for all cases listed below.
   // Now they are diffirent because of Layout:_getAdditionalOffset do
   // not meet for cases when no annotation, when annotation exists and
   // when histogram used

    if (this._config.annotationsLayout === "histogram") {
      return margin / 2 + setNumber * (margin + width + 2) + pad * 2 + 1;
    } else {
      translate = width + setNumber * (margin + width) + pad * 2;
      if (pad > 0) {
        return translate;
      } else {
        return translate + 4 + (2 * setNumber);
      }
    }
  }

    // If detailed description provided start to calculate offsets
    // for each chromosome set separately. This should be done only once
  if (!this._translate) {
    // First offset equals to zero
    this._translate = [this._ploidy.getSetSize(0) * width * 2];
    var prevTranslate;
    // Loop through description set
    for (var i = 1; i < this._config.ploidyDesc.length; i++) {
      prevTranslate = this._translate[i - 1];
      this._translate[i] = prevTranslate + this._getChromosomeSetSize(i - 1);
    }
  }

  return this._translate[setNumber];
};

VerticalLayout.prototype.getChromosomeSetLabelXPosition = function() {
  return this._config.chrWidth / -2;
};

VerticalLayout.prototype.getChromosomeLabelXPosition = function() {
  return this._config.chrWidth / -2;
};

function PairedLayout(config, ideo) {
  Layout.call(this, config, ideo);

  this._class = 'PairedLayout';

  this._margin = {
    left: 30
  };
}

PairedLayout.prototype = Object.create(Layout.prototype);

PairedLayout.prototype.rotateForward = function(setNumber, chrNumber, chrElement, callback) {
  var self = this;

    // Get ideo container and chromosome set dimensions
  var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
  var chrBox = chrElement.getBoundingClientRect();
    // Evaluate dimensions scale coefficients
  var scaleX = (ideoBox.width / chrBox.height) * 0.97;
  var scaleY = this._getYScale();
    // Evaluate y offset of chromosome. It is different for first and the second one
  var yOffset = setNumber ? 150 : 25;

  var transform = 'translate(15, ' + yOffset + ') scale(' + scaleX + ', ' + scaleY + ')';

    // Run rotation procedure
  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", transform)
        .on('end', function() {
            // Run callback function if provided
          if (callback) {
            callback();
          }
            // Rotate band labels
          d3.select(chrElement.parentNode).selectAll('g.bandLabel text')
                .attr('transform', 'rotate(90) translate(0, ' + (6 * Number(!setNumber)) + ')')
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
        }).attr('x', function(d, i) {
          return 0;
        }).attr('y', function(d, i) {
          return yOffset + (self._config.chrWidth * scaleX / 2) * 1.15;
        }).style('opacity', 0)
        .text(String)
        .transition()
        .style('opacity', 1);
};

PairedLayout.prototype.rotateBack = function(setNumber, chrNumber, chrElement, callback) {
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

PairedLayout.prototype.getHeight = function(taxId) {
  return this._config.chrHeight + this._margin.left * 1.5;
};

PairedLayout.prototype.getChromosomeBandTickY1 = function(chrNumber) {
  return chrNumber % 2 ? this._config.chrWidth : this._config.chrWidth * 2;
};

PairedLayout.prototype.getChromosomeBandTickY2 = function(chrNumber) {
  return chrNumber % 2 ? this._config.chrWidth - this._tickSize : this._config.chrWidth * 2 + this._tickSize;
};

PairedLayout.prototype.getChromosomeBandLabelAnchor = function(chrNumber) {
  return chrNumber % 2 ? null : 'end';
};

PairedLayout.prototype.getChromosomeBandLabelTranslate = function(band, chrNumber) {
  var x = chrNumber % 2 ? 10 : -this._config.chrWidth - 10;
  var y = this._ideo.round(band.px.start + band.px.width / 2) + 3;

  return {
    x: y,
    y: y,
    translate: 'rotate(-90) translate(' + x + ', ' + y + ')'
  };
};

PairedLayout.prototype.getChromosomeLabelXPosition = function(i) {
  return -this._tickSize;
};

PairedLayout.prototype.getChromosomeSetLabelXPosition = function(i) {
  return this._config.chrWidth / -2;
};

PairedLayout.prototype.getChromosomeSetLabelTranslate = function() {
  return 'rotate(-90)';
};

PairedLayout.prototype.getChromosomeSetTranslate = function(setNumber) {
  return 'rotate(90) translate(' + this._margin.left + ', -' + this.getChromosomeSetYTranslate(setNumber) + ')';
};

PairedLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {
  return 200 * (setNumber + 1);
};

function SmallLayout(config, ideo) {
  Layout.call(this, config, ideo);

  this._class = 'SmallLayout';

  this._margin = {
    left: 36.5,
    top: 10
  };
}

SmallLayout.prototype = Object.create(Layout.prototype);

SmallLayout.prototype.rotateForward = function(setNumber, chrNumber,
  chrElement, callback) {
  var ideoBox = d3.select("#_ideogram").node().getBoundingClientRect();
  var chrBox = chrElement.getBoundingClientRect();

  var scaleX = (ideoBox.width / chrBox.height) * 0.97;
  var scaleY = this._getYScale();

  transform = "translate(5, 25) scale(" + scaleX + ", " + scaleY + ")";

  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", transform)
        .on('end', callback);
};

SmallLayout.prototype.rotateBack = function(setNumber, chrNumber, chrElement,
  callback) {
  var translate = this.getChromosomeSetTranslate(setNumber);

  d3.select(chrElement.parentNode)
        .transition()
        .attr("transform", translate)
        .on('end', callback);
};

SmallLayout.prototype.getHeight = function() {
  return this._config.rows * (this._config.chrHeight + this._margin.top * 1.5);
};

SmallLayout.prototype.getChromosomeBandLabelTranslate = function() {

};

SmallLayout.prototype.getChromosomeSetLabelTranslate = function() {
  return 'rotate(-90)';
};

SmallLayout.prototype.getChromosomeSetTranslate = function(setNumber) {
    // Get organisms id list
  var organisms = [];
  this._ideo.getTaxids(function(taxIdList) {
    organisms = taxIdList;
  });
    // Get first organism chromosomes amount
  var size = this._ideo.config.chromosomes[organisms[0]].length;
    // Amount of chromosomes per number
  var rowSize = size / this._config.rows;

  var xOffset;
  var yOffset;

  if (setNumber > rowSize - 1) {
    xOffset = this._margin.left + this._config.chrHeight * 1.4;
    yOffset = this.getChromosomeSetYTranslate(setNumber - rowSize);
  } else {
    xOffset = this._margin.left;
    yOffset = this.getChromosomeSetYTranslate(setNumber);
  }

  return 'rotate(90) translate(' + xOffset + ', -' + yOffset + ')';
};

SmallLayout.prototype.getChromosomeSetYTranslate = function(setNumber) {
    // Get additional padding caused by annotation tracks
  var additionalPadding = this._getAdditionalOffset();
    // If no detailed description provided just use one formula for all cases
  return (
    this._margin.left * (setNumber) + this._config.chrWidth +
    additionalPadding * 2 + additionalPadding * setNumber
  );
};

SmallLayout.prototype.getChromosomeSetLabelXPosition = function(setNumber) {
  return (
    ((this._ploidy.getSetSize(setNumber) * this._config.chrWidth + 20) / -2) +
    (this._config.ploidy > 1 ? 0 : this._config.chrWidth)
  );
};

SmallLayout.prototype.getChromosomeLabelXPosition = function() {
  return this._config.chrWidth / -2;
};

function Ploidy(config) {
  this._config = config;
  this._description = this._normilize(this._config.ploidyDesc);
}

// Get number of chromosomes in a chromosome set
Ploidy.prototype.getChromosomesNumber = function(setNumber) {
  if (this._config.ploidyDesc) {
    var chrSetCode = this._config.ploidyDesc[setNumber];
    if (chrSetCode instanceof Object) {
      return Object.keys(chrSetCode)[0].length;
    } else {
      return chrSetCode.length;
    }
  } else {
    return this._config.ploidy || 1;
  }
};

// Normalize use defined description
Ploidy.prototype._normilize = function(description) {
    // Return the same if no description provided
  if (!description) {
    return description;
  }

    // Array of normalized description objects
  var normalized = [];

     // Loop through description and normalize
  for (var key in description) {
    if (typeof description[key] === 'string') {
      normalized.push({
        ancestors: description[key],
        existance: this._getExistanceArray(description[key].length)
      });
    } else {
      normalized.push({
        ancestors: Object.keys(description[key])[0],
        existance: description[key][Object.keys(description[key])[0]]
      });
    }
  }

  return normalized;
};

// Get array filled by '11' elements
Ploidy.prototype._getExistanceArray = function(length) {
  var array = [];

  for (var i = 0; i < length; i++) {
    array.push('11');
  }

  return array;
};

Ploidy.prototype.getSetSize = function(chrSetNumber) {
  if (this._description) {
    return this._description[chrSetNumber].ancestors.length;
  } else {
    return 1;
  }
};

// Get ancestor letter
Ploidy.prototype.getAncestor = function(chrSetNumber, chrNumber) {
  if (this._description) {
    return this._description[chrSetNumber].ancestors[chrNumber];
  } else {
    return '';
  }
};

// Check if chromosome's arm should be rendered.
// If no description was provided, method returns true and
// something another depending on user provided description.
Ploidy.prototype.isExists = function(chrSetNumber, chrNumber, armNumber) {
  if (this._description) {
    return Number(this._description[chrSetNumber].existance[chrNumber][armNumber]) > 0;
  } else {
    return true;
  }
};

function Color(config) {
    // Ideogram config
  this._config = config;
  this._ploidy = new Ploidy(this._config);
}

Color.prototype.getArmColor = function(chrSetNumber, chrNmber, armNumber) {
  if (this._config.armColors) {
    return this._config.armColors[armNumber];
  } else if (this._config.ancestors) {
    return this._getPolyploidArmColor(chrSetNumber, chrNmber, armNumber);
  } else {
    return null;
  }
};

Color.prototype.getBorderColor = function(chrSetNumber, chrNmber, armNumber) {
  if (chrNmber < this._config.ploidy) {
    return '#000';
  } else if (this._ploidy.isExists(chrSetNumber, chrNmber, armNumber)) {
    return '#000';
  } else {
    return '#fff';
  }
};

Color.prototype._getPolyploidArmColor = function(chrSetNumber, chrNmber, armNumber) {
  if (!this._ploidy.isExists(chrSetNumber, chrNmber, armNumber)) {
    return 'transparent';
  } else {
    return this._config.ancestors[this._ploidy.getAncestor(chrSetNumber, chrNmber, armNumber)];
  }
};

function Chromosome(adapter, config, ideo) {
  this._adapter = adapter;
  this._model = this._adapter.getModel();
  this._config = config;
  this._ideo = ideo;
  this._color = new Color(this._config);
  this._bumpCoefficient = 5;
}

// Factory method
Chromosome.getInstance = function(adapter, config, ideo) {
  if (adapter.getModel().centromerePosition === 'telocentric') {
    return new TelocentricChromosome(adapter, config, ideo);
  } else {
    return new MetacentricChromosome(adapter, config, ideo);
  }
};

Chromosome.prototype._addPArmShape = function(clipPath, isPArmRendered) {
  if (isPArmRendered) {
    return clipPath.concat(this._getPArmShape());
  } else {
    return clipPath;
  }
};

Chromosome.prototype._addQArmShape = function(clipPath, isQArmRendered) {
  if (isQArmRendered) {
    return clipPath.concat(this._getQArmShape());
  } else {
    return clipPath;
  }
};

Chromosome.prototype.render = function(container, chrSetNumber, chrNumber) {
    // Append bands container and apply clip-path on it
  container = container.append('g')
    .attr('class', 'bands')
    .attr("clip-path", "url(#" + this._model.id + "-chromosome-set-clippath)");

    // Render chromosome arms
  var isPArmRendered = this._renderPArm(container, chrSetNumber, chrNumber);
  var isQArmRendered = this._renderQArm(container, chrSetNumber, chrNumber);

    // Render range set
  this._renderRangeSet(container, chrSetNumber, chrNumber);

    // Push arms shape string into clipPath array
  var clipPath = [];
  clipPath = this._addPArmShape(clipPath, isPArmRendered);
  clipPath = this._addQArmShape(clipPath, isQArmRendered);

    // Render chromosome border
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
          return d.class;
        });

  return clipPath;
};

Chromosome.prototype._renderRangeSet = function(container, chrSetNumber,
  chrNumber) {
  if (!('rangeSet' in this._config)) {
    return;
  }

  var rangeSet = this._config.rangeSet.filter(function(range) {
    return range.chr - 1 === chrSetNumber;
  }).map(function(range) {
    return new Range(range);
  });

  var rangesContainer = container.append('g')
        .attr('class', 'range-set');

  var self = this;
  var ideo = self._ideo;
  var bandsXOffset = ideo._bandsXOffset;

  rangesContainer.selectAll('rect.range')
        .data(rangeSet)
        .enter()
        .append('rect')
        .attr('class', 'range')
        .attr('x', function(range) {
          var startPx = ideo.convertBpToPx(self._model, range.getStart());
          return startPx - bandsXOffset;
        }).attr('y', 0)
        .attr('width', function(range) {
          var lengthPx = ideo.convertBpToPx(self._model, range.getLength());
          return lengthPx - bandsXOffset;
        }).attr('height', this._config.chrWidth)
        .style('fill', function(range) {
          return range.getColor(chrNumber);
        });
};

// Get chromosome's shape main values
Chromosome.prototype._getShapeData = function() {
    // First q band from bands sequence
  var firstQBand;
  for (var i = 0; i < this._model.bands.length; i++) {
    if (this._model.bands[i].name[0] === 'q') {
      firstQBand = this._model.bands[i];
      break;
    }
  }

  // Chromosome's right position
  var lastBand = this._model.bands.length - 1;
  var rightTerminalPosition = this._model.bands[lastBand].px.stop;

    // Properties description:
    // x1 - left terminal start position
    // x2 - centromere position
    // x3 - right terminal end position
    // w - chromosome width
    // b - bump size
  return {
    x1: 0,
    x2: firstQBand ? firstQBand.px.start : rightTerminalPosition,
    x3: rightTerminalPosition,
    w: this._config.chrWidth,
    b: this._config.chrWidth / this._bumpCoefficient
  };
};

Chromosome.prototype._getPArmShape = function() {
  var d = this._getShapeData(),
    x = d.x2 - d.b;

  return {
    class: '',
    path:
      'M' + d.b + ',0 ' +
      'L' + x + ',0 ' +
      'Q' + (d.x2 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
      'L' + d.b + ',' + d.w + ' ' +
      'Q-' + d.b + ',' + (d.w / 2) + ',' + d.b + ',0'
  };
};

Chromosome.prototype._getQArmShape = function() {
  var d = this._getShapeData(),
    x = d.x3 - d.b;

  return {
    class: '',
    path:
      'M' + (d.x2 + d.b) + ',0 ' +
      'L' + x + ',0 ' +
      'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
      'L' + (d.x2 + d.b) + ',' + d.w + ' ' +
      'Q' + (d.x2 - d.b) + ',' + (d.w / 2) + ',' + (d.x2 + d.b) + ',0'
  };
};

// Render arm bands
Chromosome.prototype._renderBands = function(container, chrSetNumber,
  chrNumber, bands, arm) {
  var self = this;
  var armNumber = arm === 'p' ? 0 : 1;
  var fill = self._color.getArmColor(chrSetNumber, chrNumber, armNumber);

  container.selectAll("path.band." + arm)
    .data(bands)
    .enter()
    .append("path")
    .attr("id", function(d) {
      return self._model.id + "-" + d.name.replace(".", "-");
    })
    .attr("class", function(d) {
      return 'band ' + arm + '-band ' + d.stain;
    })
    .attr("d", function(d) {
      var start = self._ideo.round(d.px.start);
      var length = self._ideo.round(d.px.width);

      x = start + length;

      return "M " + start + ", 0" +
            "l " + length + " 0 " +
            "l 0 " + self._config.chrWidth + " " +
            "l -" + length + " 0 z";
    })
    .style('fill', fill);
};

// Render chromosome's p arm.
// Returns boolean which indicates is any bands was rendered
Chromosome.prototype._renderPArm = function(container, chrSetNumber,
  chrNumber) {
  var bands = this._model.bands.filter(function(band) {
    return band.name[0] === 'p';
  });

  this._renderBands(container, chrSetNumber, chrNumber, bands, 'p');

  return Boolean(bands.length);
};

// Render chromosome's q arm.
// Returns boolean which indicates is any bands was rendered
Chromosome.prototype._renderQArm = function(container, chrSetNumber,
  chrNumber) {
  var bands = this._model.bands.filter(function(band) {
    return band.name[0] === 'q';
  });

  this._renderBands(container, chrSetNumber, chrNumber, bands, 'q');

  return Boolean(bands.length);
};

function TelocentricChromosome(model, config, ideo) {
  Chromosome.call(this, model, config, ideo);
  this._class = 'TelocentricChromosome';
  this._pArmOffset = 3;
}

TelocentricChromosome.prototype = Object.create(Chromosome.prototype);

TelocentricChromosome.prototype._addPArmShape = function(clipPath) {
  return clipPath.concat(this._getPArmShape());
};

TelocentricChromosome.prototype._getPArmShape = function() {
  var d = this._getShapeData();
  d.o = this._pArmOffset;

  return [{
    class: 'acen',
    path: 'M' + d.x2 + ',1' +
            'L' + (d.x2 - d.o) + ',1 ' +
            'L' + (d.x2 - d.o) + ',' + (d.w - 1) + ' ' +
            'L' + d.x2 + ',' + (d.w - 1)
  }, {
    class: 'gpos100',
    path: 'M' + (d.x2 - d.o + 1) + ',0' +
        'L' + (d.x2 - d.o) + ',0 ' +
        'L' + (d.x2 - d.o) + ',' + d.w + ' ' +
        'L' + (d.x2 - d.o + 1) + ',' + d.w
  }];
};

TelocentricChromosome.prototype._getQArmShape = function() {
  var d = this._getShapeData(),
    x = d.x3 - d.b;

  return {
    class: '',
    path:
      'M' + d.x2 + ',0 ' +
      'L' + x + ',0 ' +
      'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
      'L' + d.x2 + ',' + d.w
  };
};

function MetacentricChromosome(model, config, ideo) {
  Chromosome.call(this, model, config, ideo);
  this._class = 'MetacentricChromosome';
}

MetacentricChromosome.prototype = Object.create(Chromosome.prototype);

// https://github.com/stefanpenner/es6-promise
(function(){"use strict";function t(t){return"function"==typeof t||"object"==typeof t&&null!==t}function e(t){return"function"==typeof t}function n(t){G=t}function r(t){Q=t}function o(){return function(){process.nextTick(a)}}function i(){return function(){B(a)}}function s(){var t=0,e=new X(a),n=document.createTextNode("");return e.observe(n,{characterData:!0}),function(){n.data=t=++t%2}}function u(){var t=new MessageChannel;return t.port1.onmessage=a,function(){t.port2.postMessage(0)}}function c(){return function(){setTimeout(a,1)}}function a(){for(var t=0;J>t;t+=2){var e=tt[t],n=tt[t+1];e(n),tt[t]=void 0,tt[t+1]=void 0}J=0}function f(){try{var t=require,e=t("vertx");return B=e.runOnLoop||e.runOnContext,i()}catch(n){return c()}}function l(t,e){var n=this,r=new this.constructor(p);void 0===r[rt]&&k(r);var o=n._state;if(o){var i=arguments[o-1];Q(function(){x(o,r,i,n._result)})}else E(n,r,t,e);return r}function h(t){var e=this;if(t&&"object"==typeof t&&t.constructor===e)return t;var n=new e(p);return g(n,t),n}function p(){}function _(){return new TypeError("You cannot resolve a promise with itself")}function d(){return new TypeError("A promises callback cannot return that same promise.")}function v(t){try{return t.then}catch(e){return ut.error=e,ut}}function y(t,e,n,r){try{t.call(e,n,r)}catch(o){return o}}function m(t,e,n){Q(function(t){var r=!1,o=y(n,e,function(n){r||(r=!0,e!==n?g(t,n):S(t,n))},function(e){r||(r=!0,j(t,e))},"Settle: "+(t._label||" unknown promise"));!r&&o&&(r=!0,j(t,o))},t)}function b(t,e){e._state===it?S(t,e._result):e._state===st?j(t,e._result):E(e,void 0,function(e){g(t,e)},function(e){j(t,e)})}function w(t,n,r){n.constructor===t.constructor&&r===et&&constructor.resolve===nt?b(t,n):r===ut?j(t,ut.error):void 0===r?S(t,n):e(r)?m(t,n,r):S(t,n)}function g(e,n){e===n?j(e,_()):t(n)?w(e,n,v(n)):S(e,n)}function A(t){t._onerror&&t._onerror(t._result),T(t)}function S(t,e){t._state===ot&&(t._result=e,t._state=it,0!==t._subscribers.length&&Q(T,t))}function j(t,e){t._state===ot&&(t._state=st,t._result=e,Q(A,t))}function E(t,e,n,r){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+it]=n,o[i+st]=r,0===i&&t._state&&Q(T,t)}function T(t){var e=t._subscribers,n=t._state;if(0!==e.length){for(var r,o,i=t._result,s=0;s<e.length;s+=3)r=e[s],o=e[s+n],r?x(n,r,o,i):o(i);t._subscribers.length=0}}function M(){this.error=null}function P(t,e){try{return t(e)}catch(n){return ct.error=n,ct}}function x(t,n,r,o){var i,s,u,c,a=e(r);if(a){if(i=P(r,o),i===ct?(c=!0,s=i.error,i=null):u=!0,n===i)return void j(n,d())}else i=o,u=!0;n._state!==ot||(a&&u?g(n,i):c?j(n,s):t===it?S(n,i):t===st&&j(n,i))}function C(t,e){try{e(function(e){g(t,e)},function(e){j(t,e)})}catch(n){j(t,n)}}function O(){return at++}function k(t){t[rt]=at++,t._state=void 0,t._result=void 0,t._subscribers=[]}function Y(t){return new _t(this,t).promise}function q(t){var e=this;return new e(I(t)?function(n,r){for(var o=t.length,i=0;o>i;i++)e.resolve(t[i]).then(n,r)}:function(t,e){e(new TypeError("You must pass an array to race."))})}function F(t){var e=this,n=new e(p);return j(n,t),n}function D(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function K(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function L(t){this[rt]=O(),this._result=this._state=void 0,this._subscribers=[],p!==t&&("function"!=typeof t&&D(),this instanceof L?C(this,t):K())}function N(t,e){this._instanceConstructor=t,this.promise=new t(p),this.promise[rt]||k(this.promise),I(e)?(this._input=e,this.length=e.length,this._remaining=e.length,this._result=new Array(this.length),0===this.length?S(this.promise,this._result):(this.length=this.length||0,this._enumerate(),0===this._remaining&&S(this.promise,this._result))):j(this.promise,U())}function U(){return new Error("Array Methods must be provided an Array")}function W(){var t;if("undefined"!=typeof global)t=global;else if("undefined"!=typeof self)t=self;else try{t=Function("return this")()}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}var n=t.Promise;(!n||"[object Promise]"!==Object.prototype.toString.call(n.resolve())||n.cast)&&(t.Promise=pt)}var z;z=Array.isArray?Array.isArray:function(t){return"[object Array]"===Object.prototype.toString.call(t)};var B,G,H,I=z,J=0,Q=function(t,e){tt[J]=t,tt[J+1]=e,J+=2,2===J&&(G?G(a):H())},R="undefined"!=typeof window?window:void 0,V=R||{},X=V.MutationObserver||V.WebKitMutationObserver,Z="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),$="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,tt=new Array(1e3);H=Z?o():X?s():$?u():void 0===R&&"function"==typeof require?f():c();var et=l,nt=h,rt=Math.random().toString(36).substring(16),ot=void 0,it=1,st=2,ut=new M,ct=new M,at=0,ft=Y,lt=q,ht=F,pt=L;L.all=ft,L.race=lt,L.resolve=nt,L.reject=ht,L._setScheduler=n,L._setAsap=r,L._asap=Q,L.prototype={constructor:L,then:et,"catch":function(t){return this.then(null,t)}};var _t=N;N.prototype._enumerate=function(){for(var t=this.length,e=this._input,n=0;this._state===ot&&t>n;n++)this._eachEntry(e[n],n)},N.prototype._eachEntry=function(t,e){var n=this._instanceConstructor,r=n.resolve;if(r===nt){var o=v(t);if(o===et&&t._state!==ot)this._settledAt(t._state,e,t._result);else if("function"!=typeof o)this._remaining--,this._result[e]=t;else if(n===pt){var i=new n(p);w(i,t,o),this._willSettleAt(i,e)}else this._willSettleAt(new n(function(e){e(t)}),e)}else this._willSettleAt(r(t),e)},N.prototype._settledAt=function(t,e,n){var r=this.promise;r._state===ot&&(this._remaining--,t===st?j(r,n):this._result[e]=n),0===this._remaining&&S(r,this._result)},N.prototype._willSettleAt=function(t,e){var n=this;E(t,void 0,function(t){n._settledAt(it,e,t)},function(t){n._settledAt(st,e,t)})};var dt=W,vt={Promise:pt,polyfill:dt};"function"==typeof define&&define.amd?define(function(){return vt}):"undefined"!=typeof module&&module.exports?module.exports=vt:"undefined"!=typeof this&&(this.ES6Promise=vt),dt()}).call(this);

// https://github.com/kristw/d3.promise
!function(a,b){"function"==typeof define&&define.amd?define(["d3"],b):"object"==typeof exports?module.exports=b(require("d3")):a.d3.promise=b(a.d3)}(this,function(a){var b=function(){function b(a,b){return function(){var c=Array.prototype.slice.call(arguments);return new Promise(function(d,e){var f=function(a,b){return a?void e(Error(a)):void d(b)};b.apply(a,c.concat(f))})}}var c={};return["csv","tsv","json","xml","text","html"].forEach(function(d){c[d]=b(a,a[d])}),c}();return a.promise=b,b});

// https://github.com/overset/javascript-natural-sort
function naturalSort(a,b){var q,r,c=/(^([+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|^0x[\da-fA-F]+$|\d+)/g,d=/^\s+|\s+$/g,e=/\s+/g,f=/(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,g=/^0x[0-9a-f]+$/i,h=/^0/,i=function(a){return(naturalSort.insensitive&&(""+a).toLowerCase()||""+a).replace(d,"")},j=i(a),k=i(b),l=j.replace(c,"\0$1\0").replace(/\0$/,"").replace(/^\0/,"").split("\0"),m=k.replace(c,"\0$1\0").replace(/\0$/,"").replace(/^\0/,"").split("\0"),n=parseInt(j.match(g),16)||1!==l.length&&Date.parse(j),o=parseInt(k.match(g),16)||n&&k.match(f)&&Date.parse(k)||null,p=function(a,b){return(!a.match(h)||1==b)&&parseFloat(a)||a.replace(e," ").replace(d,"")||0};if(o){if(n<o)return-1;if(n>o)return 1}for(var s=0,t=l.length,u=m.length,v=Math.max(t,u);s<v;s++){if(q=p(l[s]||"",t),r=p(m[s]||"",u),isNaN(q)!==isNaN(r))return isNaN(q)?1:-1;if(/[^\x00-\x80]/.test(q+r)&&q.localeCompare){var w=q.localeCompare(r);return w/Math.abs(w)}if(q<r)return-1;if(q>r)return 1}}

// Developed by Eric Weitz (https://github.com/eweitz)

/* Constructs a prototypal Ideogram class */
var Ideogram = function(config) {
  var orientation,
    chrWidth, chrHeight,
    container, rect;

  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));

  // Organism ploidy description
  this._ploidy = new Ploidy(this.config);

  // Chromosome's layout
  this._layout = Layout.getInstance(this.config, this);

  // TODO: Document this
  this._bandsXOffset = 30;

  this.debug = false;

  if (!this.config.ploidy) {
    this.config.ploidy = 1;
  }

  if (!this.config.bandDir) {
    this.config.bandDir = "../data/bands/";
  }

  if (!this.config.container) {
    this.config.container = "body";
  }

  if (!this.config.resolution) {
    this.config.resolution = 850;
  }

  if ("showChromosomeLabels" in this.config === false) {
    this.config.showChromosomeLabels = true;
  }

  if (!this.config.chrMargin) {
    this.config.chrMargin = 10;
  }

  if (!this.config.orientation) {
    orientation = "vertical";
    this.config.orientation = orientation;
  }

  if (!this.config.chrHeight) {
    container = this.config.container;
    rect = document.querySelector(container).getBoundingClientRect();

    if (orientation === "vertical") {
      chrHeight = rect.height;
    } else {
      chrHeight = rect.width;
    }

    if (container === "body") {
      chrHeight = 500;
    }
    this.config.chrHeight = chrHeight;
  }

  if (!this.config.chrWidth) {
    chrWidth = 10;
    chrHeight = this.config.chrHeight;

    if (chrHeight < 900 && chrHeight > 500) {
      chrWidth = Math.round(chrHeight / 40);
    } else if (chrHeight >= 900) {
      chrWidth = Math.round(chrHeight / 45);
    }
    this.config.chrWidth = chrWidth;
  }

  if (!this.config.showBandLabels) {
    this.config.showBandLabels = false;
  }

  if (!this.config.brush) {
    this.config.brush = false;
  }

  if (!this.config.rows) {
    this.config.rows = 1;
  }

  this.bump = Math.round(this.config.chrHeight / 125);
  this.adjustedBump = false;
  if (this.config.chrHeight < 200) {
    this.adjustedBump = true;
    this.bump = 4;
  }

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }

  if (config.chromosome) {
    this.config.chromosomes = [config.chromosome];
    if ("showBandLabels" in config === false) {
      this.config.showBandLabels = true;
    }
    if ("rotatable" in config === false) {
      this.config.rotatable = false;
    }
  }

  if (!this.config.showNonNuclearChromosomes) {
    this.config.showNonNuclearChromosomes = false;
  }

  this.initAnnotSettings();

  this.config.chrMargin = (
    this.config.chrMargin +
    this.config.chrWidth +
    this.config.annotTracksHeight * 2
  );

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  if (config.onDrawAnnots) {
    this.onDrawAnnotsCallback = config.onDrawAnnots;
  }

  if (config.onBrushMove) {
    this.onBrushMoveCallback = config.onBrushMove;
  }

  this.coordinateSystem = "iscn";

  this.maxLength = {
    bp: 0,
    iscn: 0
  };

  // The E-Utilies In Depth: Parameters, Syntax and More:
  // https://www.ncbi.nlm.nih.gov/books/NBK25499/
  this.eutils = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  this.esearch = this.eutils + "esearch.fcgi?retmode=json";
  this.esummary = this.eutils + "esummary.fcgi?retmode=json";
  this.elink = this.eutils + "elink.fcgi?retmode=json";

  this.organisms = {
    9606: {
      commonName: "Human",
      scientificName: "Homo sapiens",
      scientificNameAbbr: "H. sapiens",
      assemblies: { // technically, primary assembly unit of assembly
        default: "GCF_000001305.14", // GRCh38
        GRCh38: "GCF_000001305.14",
        GRCh37: "GCF_000001305.13"
      }
    },
    10090: {
      commonName: "Mouse",
      scientificName: "Mus musculus",
      scientificNameAbbr: "M. musculus",
      assemblies: {
        default: "GCF_000000055.19"
      }
    },
    7227: {
      commonName: "Fly",
      scientificName: "Drosophlia melanogaster",
      scientificNameAbbr: "D. melanogaster"
    },
    4641: {
      commonName: "banana",
      scientificName: "Musa acuminata",
      scientificNameAbbr: "M. acuminata",
      assemblies: {
        default: "mock"
      }
    }
  };

  // A flat array of chromosomes
  // (this.chromosomes is an object of
  // arrays of chromosomes, keyed by organism)
  this.chromosomesArray = [];

  this.bandsToShow = [];

  this.chromosomes = {};
  this.numChromosomes = 0;
  this.bandData = {};

  this.init();
};

/**
* Gets chromosome band data from a
* TSV file, or, if band data is prefetched, from an array
*
* UCSC: #chrom chromStart  chromEnd  name  gieStain
* http://genome.ucsc.edu/cgi-bin/hgTables
*  - group: Mapping and Sequencing
*  - track: Chromosome Band (Ideogram)
*
* NCBI: #chromosome  arm band  iscn_start  iscn_stop bp_start  bp_stop stain density
* ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
*/
Ideogram.prototype.getBands = function(content, taxid, chromosomes) {
  var lines = {},
    delimiter, tsvLines, columns, line, stain, chr,
    i, init, tsvLinesLength, source,
    start, stop, firstColumn;

  if (content.slice(0, 8) === "chrBands") {
    source = "native";
  }

  if (typeof chrBands === "undefined" && source !== "native") {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    if (source === "native") {
      tsvLines = eval(content);
    } else {
      tsvLines = content;
    }
    init = 0;
  }

  firstColumn = tsvLines[0].split(delimiter)[0];
  if (firstColumn === '#chromosome') {
    source = 'ncbi';
  } else if (firstColumn === '#chrom') {
    source = 'ucsc';
  } else {
    source = 'native';
  }

  tsvLinesLength = tsvLines.length;

  if (source === 'ncbi' || source === 'native') {
    for (i = init; i < tsvLinesLength; i++) {
      columns = tsvLines[i].split(delimiter);

      chr = columns[0];

      if (
        // If a specific set of chromosomes has been requested, and
        // the current chromosome
        typeof (chromosomes) !== "undefined" &&
        chromosomes.indexOf(chr) === -1
      ) {
        continue;
      }

      if (chr in lines === false) {
        lines[chr] = [];
      }

      stain = columns[7];
      if (columns[8]) {
        // For e.g. acen and gvar, columns[8] (density) is undefined
        stain += columns[8];
      }

      line = {
        chr: chr,
        bp: {
          start: parseInt(columns[5], 10),
          stop: parseInt(columns[6], 10)
        },
        iscn: {
          start: parseInt(columns[3], 10),
          stop: parseInt(columns[4], 10)
        },
        px: {
          start: -1,
          stop: -1,
          width: -1
        },
        name: columns[1] + columns[2],
        stain: stain,
        taxid: taxid
      };

      lines[chr].push(line);
    }
  } else if (source === 'ucsc') {
    for (i = init; i < tsvLinesLength; i++) {
      // #chrom chromStart  chromEnd  name  gieStain
      // e.g. for fly:
      // chr4	69508	108296	102A1	n/a
      columns = tsvLines[i].split(delimiter);

      if (columns[0] !== 'chr' + chromosomeName) {
        continue;
      }

      stain = columns[4];
      if (stain === 'n/a') {
        stain = 'gpos100';
      }
      start = parseInt(columns[1], 10);
      stop = parseInt(columns[2], 10);

      line = {
        chr: columns[0].split('chr')[1],
        bp: {
          start: start,
          stop: stop
        },
        iscn: {
          start: start,
          stop: stop
        },
        px: {
          start: -1,
          stop: -1,
          width: -1
        },
        name: columns[3],
        stain: stain,
        taxid: taxid
      };

      lines[chr].push(line);
    }
  }

  return lines;
};

/**
* Generates a model object for each chromosome
* containing information on its name, DOM ID,
* length in base pairs or ISCN coordinates,
* cytogenetic bands, centromere position, etc.
*/
Ideogram.prototype.getChromosomeModel = function(bands, chromosome, taxid,
  chrIndex) {
  var chr = {},
    band,
    width, pxStop,
    chrHeight = this.config.chrHeight,
    maxLength = this.maxLength,
    chrLength,
    cs, hasBands;

  cs = this.coordinateSystem;
  hasBands = (typeof bands !== "undefined");

  if (hasBands) {
    chr.name = chromosome;
    chr.length = bands[bands.length - 1][cs].stop;
    chr.type = "nuclear";
  } else {
    chr = chromosome;
  }

  chr.chrIndex = chrIndex;

  chr.id = "chr" + chr.name + "-" + taxid;

  if (this.config.fullChromosomeLabels === true) {
    var orgName = this.organisms[taxid].scientificNameAbbr;
    chr.name = orgName + " chr" + chr.name;
  }

  chrLength = chr.length;

  pxStop = 0;

  if (hasBands) {
    for (var i = 0; i < bands.length; i++) {
      band = bands[i];
      var csLength = band[cs].stop - band[cs].start;
      width = chrHeight * chr.length / maxLength[cs] * csLength / chrLength;

      bands[i].px = {start: pxStop, stop: pxStop + width, width: width};

      pxStop = bands[i].px.stop;

      if (hasBands && band.stain === "acen" && band.name[0] === "p") {
        chr.pcenIndex = i;
      }
    }
  } else {
    pxStop = chrHeight * chr.length / maxLength[cs];
  }

  chr.width = pxStop;

  chr.scale = {};

  // TODO:
  //
  // A chromosome-level scale property is likely
  // nonsensical for any chromosomes that have cytogenetic band data.
  // Different bands tend to have ratios between number of base pairs
  // and physical length.
  //
  // However, a chromosome-level scale property is likely
  // necessary for chromosomes that do not have band data.
  //
  // This needs further review.
  if (this.config.multiorganism === true) {
    chr.scale.bp = 1;
    // chr.scale.bp = band.iscn.stop / band.bp.stop;
    chr.scale.iscn = chrHeight * chrLength / maxLength.bp;
  } else {
    chr.scale.bp = chrHeight / maxLength.bp;
    if (hasBands) {
      chr.scale.iscn = chrHeight / maxLength.iscn;
    }
  }
  chr.bands = bands;

  chr.centromerePosition = "";
  if (hasBands && bands[0].bp.stop - bands[0].bp.start === 1) {
    // As with mouse
    chr.centromerePosition = "telocentric";

    // Remove placeholder pter band
    chr.bands = chr.bands.slice(1);
  }

  return chr;
};

/**
* Draws labels for each chromosome, e.g. "1", "2", "X".
* If ideogram configuration has 'fullChromosomeLabels: True',
* then labels includes name of taxon, which can help when
* depicting orthologs.
*/
Ideogram.prototype.drawChromosomeLabels = function() {
  var ideo = this;

  var chromosomeLabelClass = ideo._layout.getChromosomeLabelClass();

  var chrSetLabelXPosition = ideo._layout.getChromosomeSetLabelXPosition();
  var chrSetLabelTranslate = ideo._layout.getChromosomeSetLabelTranslate();

  // Append chromosomes set's labels
  d3.selectAll(".chromosome-set-container")
        .append("text")
        .data(ideo.chromosomesArray)
        .attr("class", 'chromosome-set-label ' + chromosomeLabelClass)
        .attr("transform", chrSetLabelTranslate)
        .attr("x", chrSetLabelXPosition)
        .attr("y", function(d, i) {
          return ideo._layout.getChromosomeSetLabelYPosition(i);
        }).attr("text-anchor", ideo._layout.getChromosomeSetLabelAnchor())
        .each(function(d, i) {
            // Get label lines
          var lines;
          if (d.name.indexOf(' ') === -1) {
            lines = [d.name];
          } else {
            lines = d.name.match(/^(.*)\s+([^\s]+)$/).slice(1).reverse();
          }

          // Render label lines
          d3.select(this).selectAll('tspan')
            .data(lines)
            .enter()
            .append('tspan')
            .attr('dy', function(d, i) {
              return i * -1.2 + 'em';
            })
            .attr('x', ideo._layout.getChromosomeSetLabelXPosition())
            .attr('class', function(a, i) {
              var fullLabels = ideo.config.fullChromosomeLabels;
              return i === 1 && fullLabels ? 'italic' : null;
            }).text(String);
        });

  var setLabelTranslate = ideo._layout.getChromosomeSetLabelTranslate();

  // Append chromosomes labels
  d3.selectAll(".chromosome-set-container")
        .each(function(a, chrSetNumber) {
          d3.select(this).selectAll(".chromosome")
                .append("text")
                .attr("class", "chrLabel")
                .attr("transform", setLabelTranslate)
                .attr("x", function(d, i) {
                  return ideo._layout.getChromosomeLabelXPosition(i);
                }).attr("y", function(d, i) {
                  return ideo._layout.getChromosomeLabelYPosition(i);
                }).text(function(d, chrNumber) {
                  return ideo._ploidy.getAncestor(chrSetNumber, chrNumber);
                }).attr("text-anchor", "middle");
        });
};

/**
* Draws labels and stalks for cytogenetic bands.
*
* Band labels are text like "p11.11".
* Stalks are small lines that visually connect labels to their bands.
*/
Ideogram.prototype.drawBandLabels = function(chromosomes) {
  var i, chr, chrs, taxid, ideo, chrModel;

  ideo = this;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }

  var textOffsets = {};

  chrIndex = 0;
  for (i = 0; i < chrs.length; i++) {
    chrIndex += 1;

    chrModel = chrs[i];

    chr = d3.select("#" + chrModel.id);

    var chrMargin = this.config.chrMargin * chrIndex,
      lineY1, lineY2;

    lineY1 = chrMargin;
    lineY2 = chrMargin - 8;

    if (
      chrIndex === 1 &&
      "perspective" in this.config && this.config.perspective === "comparative"
    ) {
      lineY1 += 18;
      lineY2 += 18;
    }

    textOffsets[chrModel.id] = [];

    chr.selectAll("text")
      .data(chrModel.bands)
      .enter()
      .append("g")
        .attr("class", function(d, i) {
          return "bandLabel bsbsl-" + i;
        })
        .attr("transform", function(d) {
          var transform = ideo._layout.getChromosomeBandLabelTranslate(d, i);

          var x = transform.x;
          // var y = transform.y;

          textOffsets[chrModel.id].push(x + 13);

          return transform.translate;
        })
        .append("text")
        .attr('text-anchor', ideo._layout.getChromosomeBandLabelAnchor(i))
        .text(function(d) {
          return d.name;
        });

    // var adapter = ModelAdapter.getInstance(ideo.chromosomesArray[i]);
    // var view = Chromosome.getInstance(adapter, ideo.config, ideo);

    chr.selectAll("line.bandLabelStalk")
      .data(chrModel.bands)
      .enter()
      .append("g")
      .attr("class", function(d, i) {
        return "bandLabelStalk bsbsl-" + i;
      })
      .attr("transform", function(d) {
        var x, y;

        x = ideo.round(d.px.start + d.px.width / 2);

        textOffsets[chrModel.id].push(x + 13);
        y = -10;

        return "translate(" + x + "," + y + ")";
      })
        .append("line")
        .attr("x1", 0)
        .attr("y1", function() {
          return ideo._layout.getChromosomeBandTickY1(i);
        }).attr("x2", 0)
        .attr("y2", function() {
          return ideo._layout.getChromosomeBandTickY2(i);
        });
  }

  for (i = 0; i < chrs.length; i++) {
    chrModel = chrs[i];

    var textsLength = textOffsets[chrModel.id].length,
      overlappingLabelXRight,
      index,
      indexesToShow = [],
      prevHiddenBoxIndex,
      xLeft,
      prevLabelXRight,
      textPadding;

    overlappingLabelXRight = 0;

    textPadding = 5;

    for (index = 0; index < textsLength; index++) {
      // Ensures band labels don't overlap

      xLeft = textOffsets[chrModel.id][index];

      if (xLeft < overlappingLabelXRight + textPadding === false) {
        indexesToShow.push(index);
      } else {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
        continue;
      }

      if (prevHiddenBoxIndex !== index) {
        // This getBoundingClientRect() forces Chrome's
        // 'Recalculate Style' and 'Layout', which takes 30-40 ms on Chrome.
        // TODO: This forced synchronous layout would be nice to eliminate.
        // prevTextBox = texts[index].getBoundingClientRect();
        // prevLabelXRight = prevTextBox.left + prevTextBox.width;

        // TODO: Account for number of characters in prevTextBoxWidth,
        // maybe also zoom.
        prevTextBoxLeft = textOffsets[chrModel.id][index];
        prevTextBoxWidth = 36;

        prevLabelXRight = prevTextBoxLeft + prevTextBoxWidth;
      }

      if (
        xLeft < prevLabelXRight + textPadding
      ) {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
      } else {
        indexesToShow.push(index);
      }
    }

    var selectorsToShow = [],
      ithLength = indexesToShow.length,
      j;

    for (j = 0; j < ithLength; j++) {
      index = indexesToShow[j];
      selectorsToShow.push("#" + chrModel.id + " .bsbsl-" + index);
    }

    this.bandsToShow = this.bandsToShow.concat(selectorsToShow);
  }
};

// Rotates chromosome labels by 90 degrees, e.g. upon clicking a chromosome to focus.
Ideogram.prototype.rotateChromosomeLabels = function(chr, chrIndex,
  orientation, scale) {
  var chrMargin, chrWidth, ideo, x, y,
    numAnnotTracks, scaleSvg, tracksHeight;

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;
  numAnnotTracks = this.config.numAnnotTracks;

  ideo = this;

  if (
    typeof (scale) !== "undefined" &&
    scale.hasOwnProperty("x") &&
    !(scale.x === 1 && scale.y === 1)
  ) {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
    x = -6;
    y = (scale === "" ? -16 : -14);
  } else {
    x = -8;
    y = -16;
    scale = {x: 1, y: 1};
    scaleSvg = "";
  }

  if (orientation === "vertical" || orientation === "") {
    var ci = chrIndex - 1;

    if (numAnnotTracks > 1 || orientation === "") {
      ci -= 1;
    }

    chrMargin2 = -4;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + chrWidth + 26;
    }

    chrMargin = ideo.config.chrMargin * ci;

    if (numAnnotTracks > 1 === false) {
      chrMargin += 1;
    }

    y = chrMargin + chrMargin2;

    chr.selectAll("text.chrLabel")
      .attr("transform", scaleSvg)
      .selectAll("tspan")
        .attr("x", x)
        .attr("y", y);
  } else {
    chrIndex -= 1;

    chrMargin2 = -chrWidth - 2;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + 8;
    }

    tracksHeight = ideo.config.annotTracksHeight;
    if (ideo.config.annotationsLayout !== "overlay") {
      tracksHeight *= 2;
    }

    chrMargin = ideo.config.chrMargin * chrIndex;
    x = -(chrMargin + chrMargin2) + 3 + tracksHeight;
    x /= scale.x;

    chr.selectAll("text.chrLabel")
      .attr("transform", "rotate(-90)" + scaleSvg)
      .selectAll("tspan")
      .attr("x", x)
      .attr("y", y);
  }
};

/**
* Rotates band labels by 90 degrees, e.g. upon clicking a chromosome to focus.
*
* This method includes proportional scaling, which ensures that
* while the parent chromosome group is scaled strongly in one dimension to fill
* available space, the text in the chromosome's band labels is
* not similarly distorted, and remains readable.
*/
Ideogram.prototype.rotateBandLabels = function(chr, chrIndex, scale) {
  var chrMargin, scaleSvg,
    orientation, bandLabels,
    ideo = this;

  bandLabels = chr.selectAll(".bandLabel");

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;

  orientation = chr.attr("data-orientation");

  if (typeof (scale) === "undefined") {
    scale = {x: 1, y: 1};
    scaleSvg = "";
  } else {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
  }

  if (
    chrIndex === 1 &&
    "perspective" in this.config && this.config.perspective === "comparative"
  ) {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = (8 - chrMargin) - 26;
        y = ideo.round(2 + d.px.start + d.px.width / 2);
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("text-anchor", "end");
  } else if (orientation === "vertical") {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = 8 - chrMargin;
        y = ideo.round(2 + d.px.start + d.px.width / 2);
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg);
  } else {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = ideo.round(-8 * scale.x + d.px.start + d.px.width / 2);
        y = chrMargin - 10;
        return "translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg);

    chr.selectAll(".bandLabelStalk line")
      .attr("transform", scaleSvg);
  }
};

Ideogram.prototype.round = function(coord) {
  // Rounds an SVG coordinates to two decimal places
  // e.g. 42.1234567890 -> 42.12
  // Per http://stackoverflow.com/a/9453447, below method is fastest
  return Math.round(coord * 100) / 100;
};

/**
* Renders all the bands and outlining boundaries of a chromosome.
*/
Ideogram.prototype.drawChromosome = function(chrModel, chrIndex, container, k) {
    // Get chromosome model adapter class
  var adapter = ModelAdapter.getInstance(chrModel);

    // Append chromosome's container
  var chromosome = container
        .append("g")
        .attr("id", chrModel.id)
        .attr("class", "chromosome " + adapter.getCssClass())
        .attr("transform", "translate(0, " + k * 20 + ")");

    // Render chromosome
  return Chromosome.getInstance(adapter, this.config, this)
        .render(chromosome, chrIndex, k);
};

/**
* Rotates a chromosome 90 degrees and shows or hides all other chromosomes
* Useful for focusing or defocusing a particular chromosome
*/
Ideogram.prototype.rotateAndToggleDisplay = function(chromosome) {
  /*
   * Do nothing if taxId not defined. But it should be defined.
   * To fix that bug we should have a way to find chromosome set number.
   */
  if (!this.config.taxid) {
    return;
  }

  var chrSetNumber =
    Number(d3.select(chromosome.parentNode).attr('data-set-number'));

  var chrNumber = Array.prototype.slice.call(
          d3.select(chromosome.parentNode).selectAll("g.chromosome")._groups[0]
      ).indexOf(chromosome);

  return this._layout.rotate(chrSetNumber, chrNumber, chromosome);
};

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertBpToPx = function(chr, bp) {
  var i, band, bpToIscnScale, iscn, px, offset, pxStart, pxLength, iscnStart,
    iscnStop, iscnLength, bpStart, bpStop, bpLength;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];

    offset = this._bandsXOffset;
    bpStart = band.bp.start;
    bpStop = band.bp.stop;
    bpLength = bpStop - bpStart;
    iscnStart = band.iscn.start;
    iscnStop = band.iscn.stop;
    iscnLength = iscnStop - iscnStart;
    pxStart = band.px.start;
    pxLength = band.px.width;

    if (bp >= bpStart && bp <= bpStop) {
      bpToIscnScale = iscnLength / bpLength;
      iscn = iscnStart + (bp - bpStart) * bpToIscnScale;

      px = offset + pxStart + (pxLength * (iscn - iscnStart) / (iscnLength));

      return px;
    }
  }

  throw new Error(
    "Base pair out of range.  " +
    "bp: " + bp + "; length of chr" + chr.name + ": " + band.bp.stop
  );
};

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertPxToBp = function(chr, px) {
  var i, band, pxToIscnScale, iscn,
    pxStart, pxStop, iscnStart, iscnStop, bpLength, iscnLength;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];

    pxStart = band.px.start;
    pxStop = band.px.stop;
    iscnStart = band.iscn.start;
    iscnStop = band.iscn.stop;

    if (px >= pxStart && px <= pxStop) {
      iscnLength = iscnStop - iscnStart;
      pxLength = pxStop - pxStart;
      bpLength = band.bp.stop - band.bp.start;

      pxToIscnScale = iscnLength / pxLength;
      iscn = iscnStart + (px - pxStart) * pxToIscnScale;

      bp = band.bp.start + (bpLength * (iscn - iscnStart) / iscnLength);

      return Math.round(bp);
    }
  }

  throw new Error(
    "Pixel out of range.  " +
    "px: " + bp + "; length of chr" + chr.name + ": " + pxStop
  );
};

/**
* Draws a trapezoid connecting a genomic range on
* one chromosome to a genomic range on another chromosome;
* a syntenic region.
*/
Ideogram.prototype.drawSynteny = function(syntenicRegions) {
  var t0 = new Date().getTime();

  var r1, r2,
    syntenies,
    i, color, opacity,
    regionID,
    ideo = this;

  syntenies = d3.select("svg")
    .insert("g", ":first-child")
    .attr("class", "synteny");

  for (i = 0; i < syntenicRegions.length; i++) {
    regions = syntenicRegions[i];

    r1 = regions.r1;
    r2 = regions.r2;

    color = "#CFC";
    if ("color" in regions) {
      color = regions.color;
    }

    opacity = 1;
    if ("opacity" in regions) {
      opacity = regions.opacity;
    }

    r1.startPx = this.convertBpToPx(r1.chr, r1.start);
    r1.stopPx = this.convertBpToPx(r1.chr, r1.stop);
    r2.startPx = this.convertBpToPx(r2.chr, r2.start);
    r2.stopPx = this.convertBpToPx(r2.chr, r2.stop);

    regionID = (
      r1.chr.id + "_" + r1.start + "_" + r1.stop + "_" +
      "__" +
      r2.chr.id + "_" + r2.start + "_" + r2.stop
    );

    syntenicRegion = syntenies.append("g")
      .attr("class", "syntenicRegion")
      .attr("id", regionID)
      .on("click", function() {
        var activeRegion = this;
        var others = d3.selectAll(".syntenicRegion")
          .filter(function() {
            return (this !== activeRegion);
          });

        others.classed("hidden", !others.classed("hidden"));
      })
      .on("mouseover", function() {
        var activeRegion = this;
        d3.selectAll(".syntenicRegion")
          .filter(function() {
            return (this !== activeRegion);
          })
          .classed("ghost", true);
      })
      .on("mouseout", function() {
        d3.selectAll(".syntenicRegion").classed("ghost", false);
      });

    var x1 = this._layout.getChromosomeSetYTranslate(0);
    var x2 = this._layout.getChromosomeSetYTranslate(1) - ideo.config.chrWidth;

    syntenicRegion.append("polygon")
      .attr("points",
        x1 + ', ' + r1.startPx + ' ' +
        x1 + ', ' + r1.stopPx + ' ' +
        x2 + ', ' + r2.stopPx + ' ' +
        x2 + ', ' + r2.startPx
      )
      .attr('style', "fill: " + color + "; fill-opacity: " + opacity);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", r1.startPx)
      .attr("y2", r2.startPx);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", r1.stopPx)
      .attr("y2", r2.stopPx);
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time in drawSyntenicRegions: " + (t1 - t0) + " ms");
  }
};

/**
* Initializes various annotation settings.  Constructor help function.
*/
Ideogram.prototype.initAnnotSettings = function() {
  if (this.config.annotationsPath || this.config.localAnnotationsPath ||
    this.annots || this.config.annotations) {
    if (!this.config.annotationHeight) {
      var annotHeight = Math.round(this.config.chrHeight / 100);
      this.config.annotationHeight = annotHeight;
    }

    if (this.config.annotationTracks) {
      this.config.numAnnotTracks = this.config.annotationTracks.length;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight =
      this.config.annotationHeight * this.config.numAnnotTracks;

    if (typeof this.config.barWidth === "undefined") {
      this.config.barWidth = 3;
    }
  } else {
    this.config.annotTracksHeight = 0;
  }

  if (typeof this.config.annotationsColor === "undefined") {
    this.config.annotationsColor = "#F00";
  }
};

/**
* Draws annotations defined by user
*/
Ideogram.prototype.drawAnnots = function(friendlyAnnots) {
  var ideo = this,
    i, j, annot,
    rawAnnots = [],
    rawAnnot, keys,
    chr,
    chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  // Occurs when filtering
  if ("annots" in friendlyAnnots[0]) {
    return ideo.drawProcessedAnnots(friendlyAnnots);
  }

  for (chr in chrs) {
    rawAnnots.push({chr: chr, annots: []});
  }

  for (i = 0; i < friendlyAnnots.length; i++) {
    annot = friendlyAnnots[i];

    for (j = 0; j < rawAnnots.length; j++) {
      if (annot.chr === rawAnnots[j].chr) {
        rawAnnot = [
          annot.name,
          annot.start,
          annot.stop - annot.start
        ];
        if ("color" in annot) {
          rawAnnot.push(annot.color);
        }
        if ("shape" in annot) {
          rawAnnot.push(annot.shape);
        }
        rawAnnots[j].annots.push(rawAnnot);
        break;
      }
    }
  }

  keys = ["name", "start", "length"];
  if ("color" in friendlyAnnots[0]) {
    keys.push("color");
  }
  if ("shape" in friendlyAnnots[0]) {
    keys.push("shape");
  }
  ideo.rawAnnots = {keys: keys, annots: rawAnnots};

  ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

  ideo.drawProcessedAnnots(ideo.annots);
};

/**
* Proccesses genome annotation data.
* Genome annotations represent features like a gene, SNP, etc. as
* a small graphical object on or beside a chromosome.
* Converts raw annotation data from server, which is structured as
* an array of arrays, into a more verbose data structure consisting
* of an array of objects.
* Also adds pixel offset information.
*/
Ideogram.prototype.processAnnotData = function(rawAnnots) {
  var keys,
    i, j, annot, annots, annotsByChr,
    chr,
    chrModel, ra,
    startPx, stopPx, px,
    color,
    ideo = this;

  keys = rawAnnots.keys;
  rawAnnots = rawAnnots.annots;

  annots = [];

  for (i = 0; i < rawAnnots.length; i++) {
    annotsByChr = rawAnnots[i];

    annots.push({chr: annotsByChr.chr, annots: []});

    for (j = 0; j < annotsByChr.annots.length; j++) {
      chr = annotsByChr.chr;
      ra = annotsByChr.annots[j];
      annot = {};

      for (var k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot.stop = annot.start + annot.length;

      chrModel = ideo.chromosomes["9606"][chr];

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);

      px = Math.round((startPx + stopPx) / 2) - 28;

      color = ideo.config.annotationsColor;
      if (ideo.config.annotationTracks) {
        annot.trackIndex = ra[3];
        color = ideo.config.annotationTracks[annot.trackIndex].color;
      } else {
        annot.trackIndex = 0;
      }

      if ('color' in annot) {
        color = annot.color;
      }

      annot.chr = chr;
      annot.chrIndex = i;
      annot.px = px;
      annot.color = color;

      annots[i].annots.push(annot);
    }
  }

  return annots;
};

/*
* Can be used for bar chart or sparkline
*/
Ideogram.prototype.getHistogramBars = function(annots) {
  var t0 = new Date().getTime();

  var i, j, chr,
    chrModels, chrPxStop, px,
    chrAnnots, chrName, chrIndex, annot,
    bars, bar, barPx, nextBarPx, barWidth,
    maxAnnotsPerBar, color,
    firstGet = false,
    histogramScaling,
    ideo = this;

  bars = [];

  barWidth = ideo.config.barWidth;
  chrModels = ideo.chromosomes[ideo.config.taxid];
  color = ideo.config.annotationsColor;

  if ("histogramScaling" in ideo.config) {
    histogramScaling = ideo.config.histogramScaling;
  } else {
    histogramScaling = "relative";
  }

  if (typeof ideo.maxAnnotsPerBar === "undefined") {
    ideo.maxAnnotsPerBar = {};
    firstGet = true;
  }

  for (chr in chrModels) {
    chrModel = chrModels[chr];
    chrIndex = chrModel.chrIndex;
    lastBand = chrModel.bands[chrModel.bands.length - 1];
    chrPxStop = lastBand.px.stop;
    numBins = Math.round(chrPxStop / barWidth);
    bar = {chr: chr, annots: []};
    for (i = 0; i < numBins; i++) {
      px = i * barWidth - ideo.bump;
      bp = ideo.convertPxToBp(chrModel, px + ideo.bump);
      bar.annots.push({
        bp: bp,
        px: px - ideo.bump,
        count: 0,
        chrIndex: chrIndex,
        chrName: chr,
        color: color,
        annots: []
      });
    }
    bars.push(bar);
  }

  for (chr in annots) {
    chrAnnots = annots[chr].annots;
    chrName = annots[chr].chr;
    chrModel = chrModels[chrName];
    chrIndex = chrModel.chrIndex - 1;
    barAnnots = bars[chrIndex].annots;
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px - ideo.bump;
      for (j = 0; j < barAnnots.length; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barPx + barWidth;
        if (j === barAnnots.length - 1) {
          nextBarPx += barWidth;
        }
        if (px >= barPx && px < nextBarPx) {
          bars[chrIndex].annots[j].count += 1;
          bars[chrIndex].annots[j].annots.push(annot);
          break;
        }
      }
    }
  }

  if (firstGet === true || histogramScaling === "relative") {
    maxAnnotsPerBar = 0;
    for (i = 0; i < bars.length; i++) {
      annots = bars[i].annots;
      for (j = 0; j < annots.length; j++) {
        barCount = annots[j].count;
        if (barCount > maxAnnotsPerBar) {
          maxAnnotsPerBar = barCount;
        }
      }
    }
    ideo.maxAnnotsPerBar[chr] = maxAnnotsPerBar;
  }

  // Set each bar's height to be proportional to
  // the height of the bar with the most annotations
  for (i = 0; i < bars.length; i++) {
    annots = bars[i].annots;
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j].count;
      height = (barCount / ideo.maxAnnotsPerBar[chr]) * ideo.config.chrMargin;
      // console.log(height)
      bars[i].annots[j].height = height;
    }
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time spent in getHistogramBars: " + (t1 - t0) + " ms");
  }

  ideo.bars = bars;

  return bars;
};

/**
* Draws genome annotations on chromosomes.
* Annotations can be rendered as either overlaid directly
* on a chromosome, or along one or more "tracks"
* running parallel to each chromosome.
*/
Ideogram.prototype.drawProcessedAnnots = function(annots) {
  var chrWidth, layout,
    annotHeight, triangle, circle, r, chrAnnot,
    x1, x2, y1, y2,
    ideo = this;

  chrMargin = this.config.chrMargin;
  chrWidth = this.config.chrWidth;

  layout = "tracks";
  if (this.config.annotationsLayout) {
    layout = this.config.annotationsLayout;
  }

  if (layout === "histogram") {
    annots = ideo.getHistogramBars(annots);
  }

  annotHeight = ideo.config.annotationHeight;

  triangle =
    'l -' + annotHeight + ' ' +
    (2 * annotHeight) +
    ' l ' + (2 * annotHeight) + ' 0 z';

  // From http://stackoverflow.com/a/10477334, with a minor change ("m -r, r")
  // Circles are supported natively via <circle>, but having it as a path
  // simplifies handling triangles, circles and other shapes in the same
  // D3 call
  r = annotHeight;
  circle =
    'm -' + r + ', ' + r +
    'a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0' +
    'a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';

  chrAnnot = d3.selectAll(".chromosome")
    .data(annots)
      .selectAll("path.annot")
      .data(function(d) {
        return d.annots;
      })
      .enter();

  if (layout === "tracks") {
    chrAnnot
      .append("g")
      .attr("id", function(d) {
        return d.id;
      })
      .attr("class", "annot")
      .attr("transform", function(d) {
        var y = ideo.config.chrWidth + (d.trackIndex * annotHeight * 2);
        return "translate(" + d.px + "," + y + ")";
      })
      .append("path")
      .attr("d", function(d) {
        if (!d.shape || d.shape === "triangle") {
          return "m0,0" + triangle;
        } else if (d.shape === "circle") {
          return circle;
        }
      })
      .attr("fill", function(d) {
        return d.color;
      });
  } else if (layout === "overlay") {
      // Overlaid annotations appear directly on chromosomes

    chrAnnot.append("polygon")
        .attr("id", function(d) {
          return d.id;
        })
        .attr("class", "annot")
        .attr("points", function(d) {
          x1 = d.px - 0.5;
          x2 = d.px + 0.5;
          y1 = chrWidth;
          y2 = 0;

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );
        })
        .attr("fill", function(d) {
          return d.color;
        });
  } else if (layout === "histogram") {
    chrAnnot.append("polygon")
        // .attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) {
          x1 = d.px + ideo.bump;
          x2 = d.px + ideo.config.barWidth + ideo.bump;
          y1 = chrWidth;
          y2 = chrWidth + d.height;

          var thisChrWidth = ideo.chromosomesArray[d.chrIndex - 1].width;

          if (x2 > thisChrWidth) {
            x2 = thisChrWidth;
          }

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );
        })
        .attr("fill", function(d) {
          return d.color;
        });
  }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
};

Ideogram.prototype.onBrushMove = function() {
  call(this.onBrushMoveCallback);
};

Ideogram.prototype.createBrush = function(from, to) {
  var ideo = this,
    width = ideo.config.chrWidth + 6.5,
    length = ideo.config.chrHeight,
    chr = ideo.chromosomesArray[0],
    chrLengthBp = chr.bands[chr.bands.length - 1].bp.stop,
    x0, x1,
    xOffset = this._layout.getMargin().left,
    xScale = d3.scaleLinear()
          .domain([0, d3.max(chr.bands, function(band) {
            return band.bp.stop;
          })]).range([xOffset, d3.max(chr.bands, function(band) {
            return band.px.stop;
          }) + xOffset]);

  if (typeof from === "undefined") {
    from = Math.floor(chrLengthBp / 10);
  }

  if (typeof right === "undefined") {
    to = Math.ceil(from * 2);
  }

  x0 = ideo.convertBpToPx(chr, from);
  x1 = ideo.convertBpToPx(chr, to);

  ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

  ideo.brush = d3.brushX()
    .extent([[xOffset, 0], [length + xOffset, width]])
    .on("brush", onBrushMove);

  var yTranslate = this._layout.getChromosomeSetYTranslate(0);
  var yOffset = yTranslate + (ideo.config.chrWidth - width) / 2;
  d3.select("#_ideogram").append("g")
    .attr("class", "brush")
    .attr("transform", "translate(0, " + yOffset + ")")
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);

  function onBrushMove() {
    var extent = d3.event.selection.map(xScale.invert),
      from = Math.floor(extent[0]),
      to = Math.ceil(extent[1]);

    ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
  }
};

/**
* Called when Ideogram has finished initializing.
* Accounts for certain ideogram properties not being set until
* asynchronous requests succeed, etc.
*/
Ideogram.prototype.onLoad = function() {
  call(this.onLoadCallback);
};

Ideogram.prototype.onDrawAnnots = function() {
  call(this.onDrawAnnotsCallback);
};

Ideogram.prototype.getBandColorGradients = function() {
  var colors,
    stain, color1, color2, color3,
    css,
    gradients = "";

  colors = [
    ["gneg", "#FFF", "#FFF", "#DDD"],
    ["gpos25", "#C8C8C8", "#DDD", "#BBB"],
    ["gpos33", "#BBB", "#BBB", "#AAA"],
    ["gpos50", "#999", "#AAA", "#888"],
    ["gpos66", "#888", "#888", "#666"],
    ["gpos75", "#777", "#777", "#444"],
    ["gpos100", "#444", "#666", "#000"],
    ["acen", "#FEE", "#FEE", "#FDD"],
    ["noBands", "#BBB", "#BBB", "#AAA"]
  ];

  for (var i = 0; i < colors.length; i++) {
    stain = colors[i][0];
    color1 = colors[i][1];
    color2 = colors[i][2];
    color3 = colors[i][3];
    gradients +=
      '<linearGradient id="' + stain + '" x1="0%" y1="0%" x2="0%" y2="100%">';
    if (stain === "gneg") {
      gradients +=
        '<stop offset="70%" stop-color="' + color2 + '" />' +
        '<stop offset="95%" stop-color="' + color3 + '" />' +
        '<stop offset="100%" stop-color="' + color1 + '" />';
    } else {
      gradients +=
        '<stop offset="5%" stop-color="' + color1 + '" />' +
        '<stop offset="15%" stop-color="' + color2 + '" />' +
        '<stop offset="60%" stop-color="' + color3 + '" />';
    }
    gradients +=
      '</linearGradient>';
  }

  gradients +=
    '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#CCE" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B; ' +
        'stroke-width:0.7;" />' +
    '</pattern>' +
    '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(-30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#DDF" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C; ' +
          'stroke-width:0.7;" />' +
    '</pattern>';

  gradients = "<defs>" + gradients + "</defs>";
  css = "<style>" +
    '.gneg {fill: url("#gneg")} ' +
    '.gpos25 {fill: url("#gpos25")} ' +
    '.gpos33 {fill: url("#gpos33")} ' +
    '.gpos50 {fill: url("#gpos50")} ' +
    '.gpos66 {fill: url("#gpos66")} ' +
    '.gpos75 {fill: url("#gpos75")} ' +
    '.gpos100 {fill: url("#gpos100")} ' +
    '.acen {fill: url("#acen")} ' +
    '.stalk {fill: url("#stalk")} ' +
    '.gvar {fill: url("#gvar")} ' +
    '.noBands {fill: url("#noBands")} ' +
  '</style>';
  gradients = css + gradients;

  // alert(gradients)

  return gradients;
};

/*
  Returns an NCBI taxonomy identifier (taxid) for the configured organism
*/
Ideogram.prototype.getTaxidFromEutils = function(callback) {
  var organism, taxonomySearch, taxid,
    ideo = this;

  organism = ideo.config.organism;

  taxonomySearch = ideo.esearch + "&db=taxonomy&term=" + organism;

  d3.json(taxonomySearch, function(data) {
    taxid = data.esearchresult.idlist[0];
    return callback(taxid);
  });
};

/**
* Returns an array of taxids for the current ideogram
* Also sets configuration parameters related to taxid(s), whether ideogram is
* multiorganism, and adjusts chromosomes parameters as needed
**/
Ideogram.prototype.getTaxids = function(callback) {
  var ideo = this,
    taxid, taxids,
    org, orgs, i,
    taxidInit, tmpChrs,
    assembly, chromosomes,
    multiorganism;

  taxidInit = "taxid" in ideo.config;

  ideo.config.multiorganism = (
    ("organism" in ideo.config && ideo.config.organism instanceof Array) ||
    (taxidInit && ideo.config.taxid instanceof Array)
  );

  multiorganism = ideo.config.multiorganism;

  if ("organism" in ideo.config) {
    // Ideogram instance was constructed using common organism name(s)
    if (multiorganism) {
      orgs = ideo.config.organism;
    } else {
      orgs = [ideo.config.organism];
    }

    taxids = [];
    tmpChrs = {};
    for (i = 0; i < orgs.length; i++) {
      // Gets a list of taxids from common organism names
      org = orgs[i];
      for (taxid in ideo.organisms) {
        if (ideo.organisms[taxid].commonName.toLowerCase() === org) {
          taxids.push(taxid);
          if (multiorganism) {
            // Adjusts 'chromosomes' configuration parameter to make object
            // keys use taxid instead of common organism name
            tmpChrs[taxid] = ideo.config.chromosomes[org];
          }
        }
      }
    }

    if (taxids.length === 0) {
      promise = new Promise(function(resolve) {
        ideo.getTaxidFromEutils(resolve);
      });
      promise.then(function(data) {
        taxid = data;
        taxids.push(taxid);

        ideo.config.taxids = taxids;
        ideo.organisms[taxid] = {
          commonName: "",
          scientificName: ideo.config.organism,
          scientificNameAbbr: ""
        };
        return new Promise(function(resolve) {
          ideo.getAssemblyAndChromosomesFromEutils(resolve);
        });
      })
      .then(function(asmChrArray) {
        assembly = asmChrArray[0];
        chromosomes = asmChrArray[1];

        ideo.config.chromosomes = chromosomes;
        ideo.organisms[taxid].assemblies = {
          default: assembly
        };

        callback(taxids);
      });
    } else {
      ideo.config.taxids = taxids;
      if (multiorganism) {
        ideo.config.chromosomes = tmpChrs;
      }

      callback(taxids);
    }
  } else {
    if (multiorganism) {
      ideo.coordinateSystem = "bp";
      if (taxidInit) {
        taxids = ideo.config.taxid;
      }
    } else {
      if (taxidInit) {
        taxids = [ideo.config.taxid];
      }
      ideo.config.taxids = taxids;
    }

    callback(taxids);
  }
};

Ideogram.prototype.sortChromosomes = function(a, b) {
  var aIsNuclear = a.type === "nuclear",
    bIsNuclear = b.type === "nuclear",
    aIsCP = a.type === "chloroplast",
    bIsCP = b.type === "chloroplast",
    aIsMT = a.type === "mitochondrion",
    bIsMT = b.type === "mitochondrion";
    // aIsPlastid = aIsMT && a.name !== "MT", // e.g. B1 in rice genome GCF_001433935.1
    // bIsPlastid = bIsMT && b.name !== "MT";

  if (aIsNuclear && bIsNuclear) {
    return naturalSort(a.name, b.name);
  } else if (!aIsNuclear && bIsNuclear) {
    return 1;
  } else if (aIsMT && bIsCP) {
    return 1;
  } else if (aIsCP && bIsMT) {
    return -1;
  } else if (!aIsMT && !aIsCP && (bIsMT || bIsCP)) {
    return -1;
  }
};

/**
  Returns names and lengths of chromosomes for an organism's best-known
  genome assembly.  Gets data from NCBI EUtils web API.
*/
Ideogram.prototype.getAssemblyAndChromosomesFromEutils = function(callback) {
  var asmAndChrArray, // [assembly_accession, chromosome_objects_array]
    assemblyAccession, chromosomes, asmSearch,
    asmUid, asmSummary,
    rsUid, nuccoreLink,
    links, ntSummary,
    results, result, cnIndex, chrName, chrLength, chromosome, type,
    ideo = this;

  organism = ideo.config.organism;

  asmAndChrArray = [];
  chromosomes = [];

  asmSearch =
    ideo.esearch +
    "&db=assembly" +
    "&term=%22" + organism + "%22[organism]" +
      "AND%20(%22latest%20refseq%22[filter])%20" +
      "AND%20%22chromosome%20level%22[filter]";

  var promise = d3.promise.json(asmSearch);

  promise
      .then(function(data) {
        // NCBI Assembly database's internal identifier (uid) for this assembly
        asmUid = data.esearchresult.idlist[0];
        asmSummary = ideo.esummary + "&db=assembly&id=" + asmUid;

        return d3.promise.json(asmSummary);
      })
      .then(function(data) {
        // RefSeq UID for this assembly
        rsUid = data.result[asmUid].rsuid;
        assemblyAccession = data.result[asmUid].assemblyaccession;

        asmAndChrArray.push(assemblyAccession);

        // Get a list of IDs for the chromosomes in this genome.
        //
        // This information does not seem to be available from well-known
        // NCBI databases like Assembly or Nucleotide, so we use GenColl,
        // a lesser-known NCBI database.
        var qs = "&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=" + rsUid;
        nuccoreLink = ideo.elink + qs;

        return d3.promise.json(nuccoreLink);
      })
      .then(function(data) {
        links = data.linksets[0].linksetdbs[0].links.join(",");
        ntSummary = ideo.esummary + "&db=nucleotide&id=" + links;

        return d3.promise.json(ntSummary);
      })
      .then(function(data) {
        results = data.result;

        for (var x in results) {
          result = results[x];

          // omit list of reult uids
          if (x === "uids") {
            continue;
          }

          if (result.genome === "mitochondrion") {
            if (ideo.config.showNonNuclearChromosomes) {
              type = result.genome;
              cnIndex = result.subtype.split("|").indexOf("plasmid");
              if (cnIndex === -1) {
                chrName = "MT";
              } else {
                // Seen in e.g. rice genome IRGSP-1.0 (GCF_001433935.1),
                // From https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=nucleotide&id=996703432,996703431,996703430,996703429,996703428,996703427,996703426,996703425,996703424,996703423,996703422,996703421,194033210,11466763,7524755
                  // genome: "mitochondrion",
                  // subtype: "cell_line|plasmid",
                  // subname: "A-58 CMS|B1",
                chrName = result.subname.split("|")[cnIndex];
              }
            } else {
              continue;
            }
          } else if (
            result.genome === "chloroplast" ||
            result.genome === "plastid"
          ) {
            type = "chloroplast";
            // Plastid encountered with rice genome IRGSP-1.0 (GCF_001433935.1)
            if (ideo.config.showNonNuclearChromosomes) {
              chrName = "CP";
            } else {
              continue;
            }
          } else {
            type = "nuclear";
            cnIndex = result.subtype.split("|").indexOf("chromosome");

            chrName = result.subname.split("|")[cnIndex];

            if (
              typeof chrName !== "undefined" &&
              chrName.substr(0, 3) === "chr"
            ) {
              // Convert "chr12" to "12", e.g. for banana (GCF_000313855.2)
              chrName = chrName.substr(3);
            }
          }

          chrLength = result.slen;

          chromosome = {
            name: chrName,
            length: chrLength,
            type: type
          };

          chromosomes.push(chromosome);
        }

        chromosomes = chromosomes.sort(ideo.sortChromosomes);
        asmAndChrArray.push(chromosomes);

        ideo.coordinateSystem = "bp";

        return callback(asmAndChrArray);
      });
};

Ideogram.prototype.initDrawChromosomes = function(bandsArray) {
  var ideo = this,
    taxids = ideo.config.taxids,
    taxid,
    chrIndex = 0,
    chrSetNumber = 0,
    i, j, chrs, chromosome, chrModel,
    defs, transform;

  defs = d3.select("defs");

  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];
    chrs = ideo.config.chromosomes[taxid];

    ideo.chromosomes[taxid] = {};

    for (j = 0; j < chrs.length; j++) {
      chromosome = chrs[j];
      bands = bandsArray[chrIndex];
      chrIndex += 1;

      chrModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);

      ideo.chromosomes[taxid][chromosome] = chrModel;
      ideo.chromosomesArray.push(chrModel);

      transform = ideo._layout.getChromosomeSetTranslate(chrSetNumber);
      chrSetNumber += 1;

      // Append chromosome set container
      var container = d3.select("svg")
        .append("g")
        .attr("class", "chromosome-set-container")
        .attr("data-set-number", j)
        .attr("transform", transform)
        .attr("id", chrModel.id + "-chromosome-set");

      var shape;
      for (var k = 0; k < this._ploidy.getChromosomesNumber(j); k++) {
        shape = ideo.drawChromosome(chrModel, chrIndex - 1, container, k);
      }

      defs.append("clipPath")
        .attr("id", chrModel.id + "-chromosome-set-clippath")
        .selectAll('path')
        .data(shape)
        .enter()
        .append('path')
        .attr('d', function(d) {
          return d.path;
        }).attr('class', function(d) {
          return d.class;
        });
    }

    if (ideo.config.showBandLabels === true) {
      ideo.drawBandLabels(ideo.chromosomes);
    }
  }
};

// Get ideogram SVG container
Ideogram.prototype.getSvg = function() {
  return d3.select('#_ideogram').node();
};

/**
* Initializes an ideogram.
* Sets some high-level properties based on instance configuration,
* fetches band and annotation data if needed, and
* writes an SVG element to the document to contain the ideogram
*
*/
Ideogram.prototype.init = function() {
  var bandDataFileNames,
    taxid, i, svgClass;

  var ideo = this;

  var t0 = new Date().getTime();

  var bandsArray = [],
    numBandDataResponses = 0,
    resolution = this.config.resolution,
    accession;

  var promise = new Promise(function(resolve) {
    ideo.getTaxids(resolve);
  });

  promise.then(function(taxids) {
    taxid = taxids[0];
    ideo.config.taxid = taxid;
    ideo.config.taxids = taxids;

    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];

      if (!ideo.config.assembly) {
        ideo.config.assembly = "default";
      }
      accession = ideo.organisms[taxid].assemblies[ideo.config.assembly];

      bandDataFileNames = {
      // Homo sapiens (human)
        9606: "native/ideogram_9606_" + accession + "_" + resolution + "_V1.js",
      // 9606: "ncbi/ideogram_9606_" + accession + "_" + resolution + "_V1.tsv",

      // Mus musculus (mouse)
        10090: "native/ideogram_10090_" + accession + "_NA_V2.js"

      // Drosophila melanogaster (fly)
      // 7227: "ucsc/drosophila_melanogaster_dm6.tsv"
      };

      if (typeof chrBands === "undefined" && taxid in bandDataFileNames) {
        d3.request(ideo.config.bandDir + bandDataFileNames[taxid])
        .on("beforesend", function(data) {
          // Ensures correct taxid is processed in response callback; using
          // simply 'taxid' variable gives the last *requested* taxid, which
          // fails when dealing with multiple taxa.
          data.taxid = taxid;
        })
        .get(function(error, data) {
          ideo.bandData[data.taxid] = data.response;
          numBandDataResponses += 1;

          if (numBandDataResponses === taxids.length) {
            processBandData();
            writeContainer();
          }
        });
      } else {
        if (typeof chrBands !== "undefined") {
        // If bands already available,
        // e.g. via <script> tag in initial page load
          ideo.bandData[taxid] = chrBands;
        }
        processBandData();
        writeContainer();
      }
    }
  });

  function writeContainer() {
    if (ideo.config.annotationsPath) {
      d3.json(
        ideo.config.annotationsPath, // URL
        function(data) { // Callback
          ideo.rawAnnots = data;
        }
      );
    }

    svgClass = "";
    if (ideo.config.showChromosomeLabels) {
      if (ideo.config.orientation === "horizontal") {
        svgClass += "labeledLeft ";
      } else {
        svgClass += "labeled ";
      }
    }

    if (
      ideo.config.annotationsLayout &&
      ideo.config.annotationsLayout === "overlay"
    ) {
      svgClass += "faint";
    }

    var gradients = ideo.getBandColorGradients();
    var svgHeight = ideo._layout.getHeight(taxid);

    d3.select(ideo.config.container)
      .append("svg")
        .attr("id", "_ideogram")
        .attr("class", svgClass)
        .attr("width", "97%")
        .attr("height", svgHeight)
        .html(gradients);

    finishInit();
  }

  /*
  * Completes default ideogram initialization
  * by calling downstream functions to
  * process raw band data into full JSON objects,
  * render chromosome and cytoband figures and labels,
  * apply initial graphical transformations,
  * hide overlapping band labels, and
  * execute callbacks defined by client code
  */
  function processBandData() {
    var j, k, chromosome, bands,
      chrLength, chr,
      bandData, bandsByChr,
      taxid, taxids, chrs, chrsByTaxid;

    bandsArray = [];
    maxLength = 0;

    if (ideo.config.multiorganism === true) {
      ideo.coordinateSystem = "bp";
      taxids = ideo.config.taxids;
      for (i = 0; i < taxids.length; i++) {
        taxid = taxids[i];
      }
    } else {
      if (typeof ideo.config.taxid === "undefined") {
        ideo.config.taxid = ideo.config.taxids[0];
      }
      taxid = ideo.config.taxid;
      taxids = [taxid];
      ideo.config.taxids = taxids;
    }

    if ("chromosomes" in ideo.config) {
      chrs = ideo.config.chromosomes;
    }
    if (ideo.config.multiorganism) {
      chrsByTaxid = chrs;
    }

    ideo.config.chromosomes = {};

    var t0B = new Date().getTime();

    for (j = 0; j < taxids.length; j++) {
      taxid = taxids[j];

      if (ideo.config.multiorganism) {
        chrs = chrsByTaxid[taxid];
      }

      if (ideo.coordinateSystem === "iscn" || ideo.config.multiorganism) {
        bandData = ideo.bandData[taxid];

        bandsByChr = ideo.getBands(bandData, taxid, chrs);

        chrs = Object.keys(bandsByChr);

        ideo.config.chromosomes[taxid] = chrs.slice();
        ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

        for (k = 0; k < chrs.length; k++) {
          chromosome = chrs[k];
          bands = bandsByChr[chromosome];
          bandsArray.push(bands);

          chrLength = {
            iscn: bands[bands.length - 1].iscn.stop,
            bp: bands[bands.length - 1].bp.stop
          };

          if (chrLength.iscn > ideo.maxLength.iscn) {
            ideo.maxLength.iscn = chrLength.iscn;
          }

          if (chrLength.bp > ideo.maxLength.bp) {
            ideo.maxLength.bp = chrLength.bp;
          }
        }
      } else if (ideo.coordinateSystem === "bp") {
        // If lacking band-level data

        ideo.config.chromosomes[taxid] = chrs.slice();
        ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

        for (k = 0; k < chrs.length; k++) {
          chr = chrs[k];
          if (chr.length > ideo.maxLength.bp) {
            ideo.maxLength.bp = chr.length;
          }
        }
      }
    }

    var t1B = new Date().getTime();
    if (ideo.debug) {
      console.log("Time in processBandData: " + (t1B - t0B) + " ms");
    }
  }

  function finishInit() {
    try {
      var t0A = new Date().getTime();

      var i;

      ideo.initDrawChromosomes(bandsArray);

      // Waits for potentially large annotation dataset
      // to be received by the client, then triggers annotation processing
      if (ideo.config.annotationsPath) {
        function pa() {
          if (typeof timeout !== "undefined") {
            window.clearTimeout(timeout);
          }

          ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
          ideo.drawProcessedAnnots(ideo.annots);

          if (ideo.initCrossFilter) {
            ideo.initCrossFilter();
          }
        }

        if (ideo.rawAnnots) {
          pa();
        } else {
          (function checkAnnotData() {
            timeout = setTimeout(function() {
              if (!ideo.rawAnnots) {
                checkAnnotData();
              } else {
                pa();
              }
            },
            50
          );
          })();
        }
      }

      if (ideo.config.showBandLabels === true) {
        var bandsToShow = ideo.bandsToShow.join(",");

      // d3.selectAll resolves to querySelectorAll (QSA).
      // QSA takes a surprisingly long time to complete,
      // and scales with the number of selectors.
      // Most bands are hidden, so we can optimize by
      // Hiding all bands, then QSA'ing and displaying the
      // relatively few bands that are shown.
        var t0C = new Date().getTime();
        d3.selectAll(".bandLabel, .bandLabelStalk").style("display", "none");
        d3.selectAll(bandsToShow).style("display", "");
        var t1C = new Date().getTime();
        if (ideo.debug) {
          console.log("Time in showing bands: " + (t1C - t0C) + " ms");
        }

        if (ideo.config.orientation === "vertical") {
          var chrID;
          for (i = 0; i < ideo.chromosomesArray.length; i++) {
            chrID = "#" + ideo.chromosomesArray[i].id;
            ideo.rotateChromosomeLabels(d3.select(chrID), i);
          }
        }
      }

      if (ideo.config.showChromosomeLabels === true) {
        ideo.drawChromosomeLabels(ideo.chromosomes);
      }

      if (ideo.config.brush === true) {
        ideo.createBrush();
      }

      if (ideo.config.annotations) {
        ideo.drawAnnots(ideo.config.annotations);
      }

      var t1A = new Date().getTime();
      if (ideo.debug) {
        console.log("Time in drawChromosome: " + (t1A - t0A) + " ms");
      }

      var t1 = new Date().getTime();
      if (ideo.debug) {
        console.log("Time constructing ideogram: " + (t1 - t0) + " ms");
      }

      if (ideo.onLoadCallback) {
        ideo.onLoadCallback();
      }

      if (!("rotatable" in ideo.config && ideo.config.rotatable === false)) {
        d3.selectAll(".chromosome").on("click", function() {
          ideogram.rotateAndToggleDisplay(this);
        });
      } else {
        d3.selectAll(".chromosome").style("cursor", "default");
      }
    } catch (e) {
      console.log(e);
      //  throw e;
    }
  }
};

/* Decompresses ideogram's annotations for crossfilter initialization
By default, annotations are clustered by chromosome, e.g.
[
  {"chr": "1", "annots": [{"from": 100, "to", 101, "chr": "1", ...}, ...]},
  {"chr": "2", "annots": [{"from": 500, "to", 501, "chr": "2", ...}, ...]},
  ...
]
This method flattens that structure to e.g.
[
  {"from": 100, "to": 101, "chr": "1", ...},
  ...
  {"from": 500, "to": 501, "chr": "2", ...},
]
See also: packAnnots
*/
Ideogram.prototype.unpackAnnots = function() {
  var chr, annots, i,
    unpackedAnnots = [],
    ideo = this,
    chrs = ideo.annots;

  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i];
    annots = chr.annots;
    unpackedAnnots = unpackedAnnots.concat(annots);
  }

  return unpackedAnnots;
};

/*
  Compresses annots back to default state.  Inverse of unpackAnnots.
*/
Ideogram.prototype.packAnnots = function(unpackedAnnots) {
  var chr, annot, i,
    annots = [],
    ideo = this,
    chrs = ideo.annots;

  for (chr in chrs) {
    annots.push({chr: chrs[chr].chr, annots: []});
  }

  for (i = 0; i < unpackedAnnots.length; i++) {
    annot = unpackedAnnots[i];
    annots[annot.chrIndex].annots.push(annot);
  }

  return annots;
};

/*
  Initializes crossfilter.  Needed for client-side filtering.
  More: https://github.com/square/crossfilter/wiki/API-Reference
*/
Ideogram.prototype.initCrossFilter = function() {
  var ideo = this,
    keys = ideo.rawAnnots.keys,
    i, facet;

  ideo.unpackedAnnots = ideo.unpackAnnots();
  ideo.crossfilter = crossfilter(ideo.unpackedAnnots);

  ideo.annotsByFacet = {};

  ideo.facets = keys.slice(3, keys.length);

  for (i = 0; i < ideo.facets.length; i++) {
    facet = ideo.facets[i];
    ideo.annotsByFacet[facet] =
      ideo.crossfilter
        .dimension(function(d) {
          return d[facet];
        });
  }
};

/*
  Filters annotations based on the given selections
  "selections" is an object of objects, e.g.

    {
      "tissue-type": {          <-- a facet
        "cerebral-cortex": 1,   <-- a filter; "1" means it is selected
        "liver": 1
      },
      "gene-type": {
        mirna": 1
      }
    }

  Translation:
  select where:
      (tissue-type is cerebral-cortex OR liver) and (gene-type is mirna)

  TODO:
    * Filter counts
    * Range filters
    * Integrate server-side filtering for very large datasets
*/
Ideogram.prototype.filterAnnots = function(selections) {
  var t0 = Date.now();

  var i, facet,
    prevFacet = null,
    results, fn,
    counts = {},
    ideo = this;

  if (Object.keys(selections).length === 0) {
    results = ideo.unpackedAnnots;
  } else {
    for (i = 0; i < ideo.facets.length; i++) {
      facet = ideo.facets[i];
      if (facet in selections) {
        fn = function(d) {
          if (d in selections[facet]) {
            return true;
          }
        };
      } else {
        fn = null;
      }
      ideo.annotsByFacet[facet].filter(fn);
      counts[facet] = ideo.annotsByFacet[facet].group().top(Infinity);
    }

    results = ideo.annotsByFacet[facet].top(Infinity);
  }

  for (i < 0; i < ideo.facets.length; i++) {
    ideo.annotsByFacet[facet].filterAll(); // clear filters
  }

  results = ideo.packAnnots(results);

  d3.selectAll("polygon.annot").remove();
  ideo.drawAnnots(results);

  console.log("Time in filterAnnots: " + (Date.now() - t0) + " ms");

  return counts;
};

// Chromosome's view utility class
function ChromosomeUtil(node) {
  this._node = node;
}

ChromosomeUtil.prototype.getLabel = function() {
  var label =
    d3
      .select(this._node)
      .select('text.chrLabel')
      .text();
  return label;
};

// Get chromosome set label
ChromosomeUtil.prototype.getSetLabel = function() {
  var setLabel =
    d3
      .select(this._node.parentNode)
      .select('text.chromosome-set-label')
      .text();
  return setLabel;
};
