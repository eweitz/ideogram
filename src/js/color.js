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
    if (chrIndex < this._config.ploidy) {
      return '#000';
    } else if (this._ploidy.exists(chrSetIndex, chrIndex, armIndex)) {
      return '#000';
    } else {
      return '#fff';
    }
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
