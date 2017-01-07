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
                start : 0,
                stop : this._model.width,
                width : this._model.width
            }
        });
    }

    return this._model;
};


ModelNoBandsAdapter.prototype.getCssClass = function() {
    return 'noBands';
};
