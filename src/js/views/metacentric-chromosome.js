import {Chromosome} from './chromosome';

export class MetacentricChromosome extends Chromosome {

  constructor(model, config, ideo) {
    super(model, config, ideo);
    this._class = 'MetacentricChromosome';
  }
}
