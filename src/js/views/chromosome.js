/* eslint-disable no-use-before-define */
import {Color} from './../color';
import {Range} from './../range';

export class Chromosome {

  constructor(adapter, config, ideo) {
    this._adapter = adapter;
    this._model = this._adapter.getModel();
    this._config = config;
    this._ideo = ideo;
    this._color = new Color(this._config);
    this._bumpCoefficient = 5;
  }

  /**
   * Factory method
   */
  static getInstance(adapter, config, ideo) {
    if (adapter.getModel().centromerePosition === 'telocentric') {
      return new TelocentricChromosome(adapter, config, ideo);
    } else {
      return new MetacentricChromosome(adapter, config, ideo);
    }
  }

  _addPArmShape(clipPath, isPArmRendered) {
    if (isPArmRendered) {
      return clipPath.concat(this._getPArmShape());
    } else {
      return clipPath;
    }
  }

  _addQArmShape(clipPath, isQArmRendered) {
    if (isQArmRendered) {
      return clipPath.concat(this._getQArmShape());
    } else {
      return clipPath;
    }
  }

  /**
   * Append bands container and apply clip-path to it
   */
  render(container, chrSetIndex, chrIndex) {

    var self, isPArmRendered, isQArmRendered, clipPath, opacity, fill,
      isFullyBanded;

    self = this;

    container = container.append('g')
      .attr('class', 'bands')
      .attr('clip-path', 'url(#' + this._model.id + '-chromosome-set-clippath)');

    // Render chromosome arms
    isPArmRendered = this._renderArm(container, chrSetIndex, chrIndex, 'p');
    isQArmRendered = this._renderArm(container, chrSetIndex, chrIndex, 'q');

    // Render range set
    this._renderRangeSet(container, chrSetIndex, chrIndex);

    // Push arms shape string into clipPath array
    clipPath = [];
    clipPath = this._addPArmShape(clipPath, isPArmRendered);
    clipPath = this._addQArmShape(clipPath, isQArmRendered);

    opacity = '0';
    fill = '';
    isFullyBanded = this.isFullyBanded();
    if ('ancestors' in this._ideo.config && !('rangeSet' in this._ideo.config)) {
      // E.g. diploid human genome (with translucent overlay)
      fill = self._color.getArmColor(chrSetIndex, chrIndex, 0);
      if (isFullyBanded) {
        opacity = '0.5';
      }
    } else if (isFullyBanded) {
      // E.g. mouse reference genome
      opacity = null;
      fill = 'transparent';
    } else if (!('ancestors' in this._ideo.config)) {
      // E.g. chimpanzee assembly Pan_tro 3.0
      opacity = '1';
    }

    // Render chromosome border
    container.append('g')
      .attr('class', 'chromosome-border')
      .selectAll('path')
      .data(clipPath)
      .enter()
      .append('path')
      .attr('fill', fill)
      .style('fill-opacity', opacity)
      .attr('stroke', function(d, i) {
        return self._color.getBorderColor(chrSetIndex, chrIndex, i);
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
  }

  _renderRangeSet(container, chrSetIndex, chrIndex) {

    var self, rangeSet, rangesContainer, ideo;

    if (!('rangeSet' in this._config)) {
      return;
    }

    rangeSet = this._config.rangeSet.filter(function(range) {
      return range.chr - 1 === chrSetIndex;
    }).map(function(range) {
      return new Range(range);
    });

    rangesContainer = container.append('g').attr('class', 'range-set');

    self = this;
    ideo = self._ideo;

    rangesContainer.selectAll('rect.range')
      .data(rangeSet)
      .enter()
      .append('rect')
      .attr('class', 'range')
      .attr('x', function(range) {
        return ideo.convertBpToPx(self._model, range.start);
      }).attr('y', 0)
      .attr('width', function(range) {
        return ideo.convertBpToPx(self._model, range.length);
      }).attr('height', this._config.chrWidth)
      .style('fill', function(range) {
        return range.getColor(chrIndex);
      });
  }

  /**
   * Get chromosome's shape main values
   */
  _getShapeData() {

    var firstQBand, i, lastBand, rightTerminalPosition;

    // First q band from bands sequence
    for (i = 0; i < this._model.bands.length; i++) {
      if (this._model.bands[i].name[0] === 'q') {
        firstQBand = this._model.bands[i];
        break;
      }
    }

    // Chromosome's right position
    lastBand = this._model.bands.length - 1;
    rightTerminalPosition = this._model.bands[lastBand].px.stop;

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
  }

  _getPArmShape() {
    var d = this._getShapeData(),
      x = d.x2 - d.b;

    if (this.isFullyBanded() || 'ancestors' in this._ideo.config) {
      // Encountered when chromosome has any of:
      //  - One placeholder "band", e.g. pig genome GCF_000003025.5
      //  - Many (> 2) bands, e.g. human reference genome
      //  - Ancestor colors in ploidy configuration, as in ploidy-basic.html
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
  }

  _getQArmShape() {
    var d = this._getShapeData(),
      x = d.x3 - d.b,
      x2b = d.x2 + d.b;

    if (this.isFullyBanded() || 'ancestors' in this._ideo.config) {
      return {
        class: '',
        path:
          'M' + x2b + ',0 ' +
          'L' + x + ',0 ' +
          'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
          'L' + x2b + ',' + d.w + ' ' +
          'Q' + (d.x2 - d.b) + ',' + (d.w / 2) + ',' + x2b + ',0'
      };
    } else {
      // e.g. chimpanzee assembly Pan_tro 3.0
      return [{
        path:
          'M' + x2b + ',0 ' +
          'L' + x + ',0 ' +
          'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
          'L' + x2b + ',' + d.w + ' ' +
          'L' + x2b + ',0'
      }, {
        class: 'acen',
        path:
          'M' + x2b + ',0' +
          'Q' + (d.x2 - d.b) + ',' + (d.w / 2) + ',' + x2b + ',' + d.w + ' ' +
          'L' + x2b + ',' + d.w +
          'L' + (x2b + 2) + ',' + d.w +
          'L' + (x2b + 2) + ',0'
      }];
    }
  }

  isFullyBanded() {
    return (
      this._model.bands &&
      (this._model.bands.length !== 2 || this._model.bands[0].name[0] === 'q')
    );
  }

  /**
   * Render arm bands
   */
  _renderBands(container, chrSetIndex, chrIndex, bands, arm) {

    var self, armIndex, fill;

    self = this;
    armIndex = arm === 'p' ? 0 : 1;
    fill = '';

    if ('ancestors' in self._ideo.config && !(self.isFullyBanded())) {
      fill = self._color.getArmColor(chrSetIndex, chrIndex, armIndex);
    }

    container.selectAll('path.band.' + arm)
      .data(bands)
      .enter()
      .append('path')
      .attr('id', function(d) {
        return self._model.id + '-' + d.name.replace('.', '-');
      })
      .attr('class', function(d) {
        return 'band ' + arm + '-band ' + d.stain;
      })
      .attr('d', function(d) {
        var start, length;

        start = self._ideo.round(d.px.start);
        length = self._ideo.round(d.px.width);

        return 'M ' + start + ', 0' +
              'l ' + length + ' 0 ' +
              'l 0 ' + self._config.chrWidth + ' ' +
              'l -' + length + ' 0 z';
      })
      .style('fill', fill);
  }

  /**
   * Render a chromosome arm.
   * Returns boolean indicating if any bands were rendered.
   */
  _renderArm(container, chrSetIndex, chrIndex, arm) {
    var bands = this._model.bands.filter(function(band) {
      return band.name[0] === arm;
    });

    this._renderBands(container, chrSetIndex, chrIndex, bands, arm);

    return Boolean(bands.length);
  }
}

export class MetacentricChromosome extends Chromosome {

  constructor(model, config, ideo) {
    super(model, config, ideo);
    this._class = 'MetacentricChromosome';
  }
}

export class TelocentricChromosome extends Chromosome {

  constructor(model, config, ideo) {
    super(model, config, ideo);
    this._class = 'TelocentricChromosome';
    this._pArmOffset = 3;
  }

  _addPArmShape(clipPath) {
    return clipPath.concat(this._getPArmShape());
  }

  _getPArmShape() {
    var d = this._getShapeData();
    d.o = this._pArmOffset;

    return [{
      class: 'acen',
      path: 'M' + (d.x2 + 2) + ',1' +
      'L' + (d.x2 + d.o + 3.25) + ',1 ' +
      'L' + (d.x2 + d.o + 3.25) + ',' + (d.w - 1) + ' ' +
      'L' + (d.x2 + 2) + ',' + (d.w - 1)
    }, {
      class: 'gpos66',
      path: 'M' + (d.x2 - d.o + 5) + ',0' +
      'L' + (d.x2 - d.o + 3) + ',0 ' +
      'L' + (d.x2 - d.o + 3) + ',' + d.w + ' ' +
      'L' + (d.x2 - d.o + 5) + ',' + d.w,
      strokeWidth: 0.5
    }];
  }

  _getQArmShape() {
    var d = this._getShapeData(),
      x = d.x3 - d.b,
      o = this._pArmOffset + 3;

    return {
      class: '',
      path:
      'M' + (d.x2 + o) + ',0 ' +
      'L' + x + ',0 ' +
      'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + x + ',' + d.w + ' ' +
      'L' + (d.x2 + o) + ',' + d.w
    };
  }
}
