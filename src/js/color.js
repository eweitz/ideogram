import {Ploidy} from './ploidy';

export class Color {

  constructor(config) {
    // Ideogram config
    this._config = config;
    this._ploidy = new Ploidy(this._config);
  }

  getArmColor(chrSetIndex, chrIndex, armIndex) {
    if (this._config.armColors) {
      return this._config.armColors[armIndex];
    } else if (this._config.ancestors) {
      return this._getPolyploidArmColor(chrSetIndex, chrIndex, armIndex);
    } else {
      return null;
    }
  }

  getBorderColor(chrSetIndex, chrIndex, armIndex) {
    const config = this._config;
    const color = config.chrBorderColor ? config.chrBorderColor : '#000';
    if (chrIndex < config.ploidy) {
      return color;
    } else if (this._ploidy.exists(chrSetIndex, chrIndex, armIndex)) {
      return color;
    } else {
      return '#fff';
    }
  }

  getFillColor() {
    const config = this._config;
    if (!config.chrFillColor) return '#AAA';
    const color = config.chrFillColor;
    if (typeof color === 'string') {
      return {arm: color, centromere: ''};
    } else {
      return color;
    };
  }

  _getPolyploidArmColor(chrSetIndex, chrIndex, armIndex) {
    if (!this._ploidy.exists(chrSetIndex, chrIndex, armIndex)) {
      return 'transparent';
    } else {
      var ancestor =
        this._ploidy.getAncestor(chrSetIndex, chrIndex, armIndex);
      return this._config.ancestors[ancestor];
    }
  }

}
