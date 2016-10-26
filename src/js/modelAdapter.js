/**
 * @public
 * @class
 * @param {Object} model
 */
function ModelAdapter(model) {

    this._model = model;
    this._class = 'ModelAdapter';
};


/**
 * @public
 * @static
 * @param {Object} model
 * @returns {ModelAdapter}
 */
ModelAdapter.getInstance = function(model) {

    if (model.bands) {
        return new ModelAdapter(model);
    } else {
        return new ModelNoBandsAdapter(model);
    }
};


/**
 * Get model.
 * @public
 * @returns {Object}
 */
ModelAdapter.prototype.getModel = function() {

    return this._model;
};


/**
 * Get chromosome CSS class.
 * @returns {String}
 */
ModelAdapter.prototype.getCssClass = function() {

    return '';
};