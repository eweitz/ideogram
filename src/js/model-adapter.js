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
