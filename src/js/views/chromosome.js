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
        })
        .attr('stroke-width', function(d) {
          return ('strokeWidth' in d ? d.strokeWidth : 1);
        })
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

  if (this._model.bands && this._model.bands.length > 2) {
    // e.g. human reference genome
    return {
      class: '',
      path:
        'M' + d.b + ',0 ' +
        'L' + x + ',0 ' +
        'Q' + (d.x2 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
        'L' + d.b + ',' + d.w + ' ' +
        'Q-' + d.b + ',' + (d.w / 2) + ',' + d.b + ',0'
    };
  } else {
    // e.g. chimpanzee assembly Pan_tro 3.0
    return [{
      class: '',
      path:
        'M' + d.b + ',0 ' +
        'L' + (x - 2) + ',0 ' +
        'L' + (x - 2) + ',' + d.w + ' ' +
        'L' + d.b + ',' + d.w + ' ' +
        'Q-' + d.b + ',' + (d.w / 2) + ',' + d.b + ',0'
    }, {
      class: 'acen',
      path:
        'M' + x + ',0 ' +
        'Q' + (d.x2 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
        'L' + x + ',' + d.w + ' ' +
        'L' + (x - 2) + ',' + d.w + ' ' +
        'L' + (x - 2) + ',0'
    }];
  }
};

Chromosome.prototype._getQArmShape = function() {
  var d = this._getShapeData(),
    x = d.x3 - d.b;

  if (this._model.bands && this._model.bands.length !== 2) {
    // Encountered when chromosome has either:
    //  - One placeholder "band", e.g. pig genome GCF_000003025.5
    //  - Many (> 2) bands, e.g. human reference genome

    return {
      class: '',
      path:
        'M' + (d.x2 + d.b) + ',0 ' +
        'L' + x + ',0 ' +
        'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
        'L' + (d.x2 + d.b) + ',' + d.w + ' ' +
        'Q' + (d.x2 - d.b) + ',' + (d.w / 2) + ',' + (d.x2 + d.b) + ',0'
    };
  } else {
    // e.g. chimpanzee assembly Pan_tro 3.0
    return [{
      path:
        'M' + (d.x2 + x) + ',0 ' +
        'L' + (x) + ',0 ' +
        'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + (x) + ',' + d.w + ' ' +
        'L' + (d.x2 + d.b) + ',' + d.w + ' ' +
        'L' + (d.x2 + d.b) + ',0'
    }, {
      class: 'acen',
      path:
        'M' + (d.x2 + d.b) + ',0' +
        'Q' + (d.x2 - d.b) + ',' + (d.w / 2) + ',' + (d.x2 + d.b) + ',' + d.w + ' ' +
        'L' + (d.x2 + d.b) + ',' + d.w +
        'L' + (d.x2 + d.b + 2) + ',' + d.w +
        'L' + (d.x2 + d.b + 2) + ',0'
    }];
  }

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
