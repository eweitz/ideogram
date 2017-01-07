function MetacentricChromosome(model, config, ideo) {
    Chromosome.call(this, model, config, ideo);
    this._class = 'MetacentricChromosome';
}


MetacentricChromosome.prototype = Object.create(Chromosome.prototype);
