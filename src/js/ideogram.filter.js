Ideogram.prototype.unpackAnnots = function() {

  var chr, annots, i,
      unpackedAnnots = [],
      ideo = this,
      chrs = ideo.annots;

  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i];
    annots = chr.annots;
    unpackedAnnots = unpackedAnnots.concat(annots);
  }

  return unpackedAnnots;

}


Ideogram.prototype.packAnnots = function(unpackedAnnots) {

  var chr, annot, i,
      annots = [],
      ideo = this,
      chrs = ideo.annots;

  for (var chr in chrs) {
    annots.push({'chr': chrs[chr], annots: []});
  }

  for (i = 0; i < unpackedAnnots.length; i++) {
    annot = unpackedAnnots[i];
    annots[annot.chrIndex]['annots'].push(annot);
  }

  return annots;

}


Ideogram.prototype.initCrossFilter = function() {
  var ideo = this;
  var unpackedAnnots = ideo.unpackAnnots();
  ideo.crossfilter = crossfilter(unpackedAnnots);
}


Ideogram.prototype.filterAnnots = function(facet, filter) {

  var annotsByFacet, results,
      ideo = this;

  annotsByFacet =
    ideo.crossfilter
      .dimension(function(d) {
        return d[facet];
      })
      .filter(function(d) {
        return d == filter;
      });

  results = annotsByFacet.top(Infinity);
  annotsByFacet.filterAll(); // clear filters
  results = ideo.packAnnots(results);
  return results;
}
