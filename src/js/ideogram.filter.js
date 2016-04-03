Ideogram.prototype.initCrossFilter = function() {

  var chr, annot, annots, i, j,
      annotsBag = [],
      ideo = this,
      chrs = ideo['annots'];


  for (var i = 0; i < chrs.length; chrs++) {
    chr = chrs[i];
    annots = chr['annots'];
    annotsBag.concat(annots)
  }

  ideo.crossfilter = crossfilter(annotsBag);

}


Ideogram.prototype.filterAnnots = function(filters, annots) {

  var ideo = this,
      filteredAnnots;

  // TODO:
  // Get list of annotations
  // Pass into crossfilter (https://github.com/square/crossfilter/wiki/API-Reference)
  // Animate transition in case of histogram

  return filteredAnnots;

}
