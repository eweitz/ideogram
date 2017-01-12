// Chromosome's view utility class
function ChromosomeUtil(node) {
  this._node = node;
}

ChromosomeUtil.prototype.getLabel = function() {
  var label =
    d3
      .select(this._node)
      .select('text.chrLabel')
      .text();
  return label;
};

// Get chromosome set label
ChromosomeUtil.prototype.getSetLabel = function() {
  var setLabel =
    d3
      .select(this._node.parentNode)
      .select('text.chromosome-set-label')
      .text();
  return setLabel;
};
