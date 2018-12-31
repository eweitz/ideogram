import * as d3selection from 'd3-selection';


var d3 = Object.assign({}, d3selection);

/**
 * Chromosome's view utility class
 */
export class ChromosomeUtil {

  constructor(node) {
    this._node = node;
  }

  getLabel() {
    var label =
      d3
        .select(this._node.parentNode)
        .select('text.chrLabel')
        .text();
    return label;
  }

  /**
   * Get chromosome set label
   */
  getSetLabel() {
    var setLabel =
      d3
        .select(this._node.parentNode)
        .select('text.chrSetLabel')
        .text();
    return setLabel;
  }
}
