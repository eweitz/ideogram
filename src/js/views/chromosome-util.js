// Chromosome's view utility class
function ChromosomeUtil(node) {
  this._node = node;
}

ChromosomeUtil.prototype.getLabel = function() {
  return d3.select(this._node).select('text.chrLabel').text();
};

// Get chromosome set label
ChromosomeUtil.prototype.getSetLabel = function() {
  return d3.select(this._node.parentNode).select('text.chromosome-set-label').text();
};
