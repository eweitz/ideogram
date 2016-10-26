/**
 * 
 */
function ModelNoBandsAdapter(model) {
    /*
     * Call parent constructor.
     */
    ModelAdapter.call(this, model);
    this._class = 'ModelNoBandsAdapter';
};


ModelNoBandsAdapter.prototype = Object.create(ModelAdapter.prototype);


/**
 * @override
 */
ModelNoBandsAdapter.prototype.getModel = function() {
    /*
     * Define bands as empty array.
     */
    this._model.bands = [];
    /*
     * If chromosome width more than 1 add single band to bands array.
     */
    if (this._model.width > 1) {
        this._model.bands.push({
            name: 'p',
            px : {
                start : 0,
                stop : this._model.width,
                width : this._model.width
            }
        });
    }

    return this._model;
};


/**
 * @override
 */
ModelNoBandsAdapter.prototype.getCssClass = function() {

    return 'noBands';
};