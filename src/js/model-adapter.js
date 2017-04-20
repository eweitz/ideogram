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
