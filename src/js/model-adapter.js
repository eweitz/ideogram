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

    // If chromosome width more than 1, add single band to bands array
    if (this._model.width > 1) {
      this._model.bands.push({
        name: 'q',
        px: {
          start: 0,
          stop: this._model.width,
          width: this._model.width
        },
        bp: {
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
