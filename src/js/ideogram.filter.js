Ideogram.prototype.initCrossFilter = function() {

  var chr, annots, i, j,
      annotsBag = [],
      ideo = this,
      chrs = ideo.annots;

  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i];
    annots = chr.annots;
    for (j = 0; j < annots.length; j ++) {
      annots[j]['chr'] = chr.chr;
    }
    annotsBag = annotsBag.concat(annots);
  }

  ideo.crossfilter = crossfilter(annotsBag);

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
  return results;
}
