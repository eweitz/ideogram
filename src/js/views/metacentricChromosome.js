/**
 * Metacentric chromosome view class.
 * @public
 * @class
 * @param {Object} model
 * @param {Object} config
 * @param {Ideogram} ideo
 */
function MetacentricChromosome(model, config, ideo) {

    Chromosome.call(this, model, config, ideo);
    this._class = 'MetacentricChromosome';
}


MetacentricChromosome.prototype = Object.create(Chromosome.prototype);