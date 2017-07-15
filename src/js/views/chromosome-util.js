import * as d3 from 'd3';

// Chromosome's view utility class
export class ChromosomeUtil {

  constructor(node) {
    this._node = node;
  }

  getLabel() {
    var label =
      d3
        .select(this._node)
        .select('text.chrLabel')
        .text();
    return label;
  }

  // Get chromosome set label
  getSetLabel() {
    var setLabel =
      d3
        .select(this._node.parentNode)
        .select('text.chromosome-set-label')
        .text();
    return setLabel;
  }
}
