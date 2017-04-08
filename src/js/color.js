export class Color {

  constructor(config) {
      // Ideogram config
    this._config = config;
    this._ploidy = new Ploidy(this._config);
  }

  getArmColor(chrSetNumber, chrNumber, armNumber) {
    if (this._config.armColors) {
      return this._config.armColors[armNumber];
    } else if (this._config.ancestors) {
      return this._getPolyploidArmColor(chrSetNumber, chrNumber, armNumber);
    } else {
      return null;
    }
  };

  getBorderColor(chrSetNumber, chrNumber, armNumber) {
    if (chrNumber < this._config.ploidy) {
      return '#000';
    } else if (this._ploidy.exists(chrSetNumber, chrNumber, armNumber)) {
      return '#000';
    } else {
      return '#fff';
    }
  };

  _getPolyploidArmColor(chrSetNumber, chrNumber,
    armNumber) {
    if (!this._ploidy.exists(chrSetNumber, chrNumber, armNumber)) {
      return 'transparent';
    } else {
      var ancestor = this._ploidy.getAncestor(chrSetNumber, chrNumber, armNumber);
      return this._config.ancestors[ancestor];
    }
  };

}
