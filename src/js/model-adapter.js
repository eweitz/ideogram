/* eslint-disable no-use-before-define */

export class ModelAdapter {

  constructor(model) {
    this._model = model;
    this._class = 'ModelAdapter';
  }

  static getInstance(model) {
    if (model.bands) {
      return new ModelAdapter(model);
    } else {
      return new ModelNoBandsAdapter(model);
    }
  }

  getModel() {
    return this._model;
  }

  getCssClass() {
    return '';
  }
}

export class ModelNoBandsAdapter extends ModelAdapter {

  constructor(model) {
    super(model);
    this._class = 'ModelNoBandsAdapter';
  }

  getModel() {
    this._model.bands = [];

    const isMT = this._model.name === 'MT'; // Is mitochondrial chromosome
    const width = this._model.width;

    if (width > 1 || isMT) {
      // Add single band to bands array
      this._model.bands.push({
        name: 'q',
        px: {
          start: 0,
          stop: width,
          width: width
        },
        bp: {
          start: 1,
          stop: this._model.bpLength
        },
        iscn: {
          start: 1,
          stop: this._model.length
        }
      });
    }

    return this._model;
  }

  getCssClass() {
    return 'noBands';
  }

}
