/* Decompresses ideogram's annotations for crossfilter initialization
By default, annotations are clustered by chromosome, e.g.
[
  {"chr": "1", "annots": [{"from": 100, "to", 101, "chr": "1", ...}, ...]},
  {"chr": "2", "annots": [{"from": 500, "to", 501, "chr": "2", ...}, ...]},
  ...
]
This method flattens that structure to e.g.
[
  {"from": 100, "to": 101, "chr": "1", ...},
  ...
  {"from": 500, "to": 501, "chr": "2", ...},
]
See also: packAnnots
*/
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

/*
  Compresses annots back to default state.  Inverse of unpackAnnots.
*/
Ideogram.prototype.packAnnots = function(unpackedAnnots) {

  var chr, annot, i,
      annots = [],
      ideo = this,
      chrs = ideo.annots;

  for (var chr in chrs) {
    annots.push({'chr': chrs[chr].chr, annots: []});
  }

  for (i = 0; i < unpackedAnnots.length; i++) {
    annot = unpackedAnnots[i];
    annots[annot.chrIndex]['annots'].push(annot);
  }

  return annots;

}

/*
  Initializes crossfilter.  Needed for client-side filtering.
  More: https://github.com/square/crossfilter/wiki/API-Reference
*/
Ideogram.prototype.initCrossFilter = function() {
  var ideo = this;
  var unpackedAnnots = ideo.unpackAnnots();
  ideo.crossfilter = crossfilter(unpackedAnnots);
}

/*
  Filters annotations based on given facet and filter selection
  TODO:
    * Multiple facets
    * Filter counts
    * Range filters
    * Integrate server-side filtering for very large datasets
*/
Ideogram.prototype.filterAnnots = function(facet, filters) {

  var t0 = Date.now();

  var annotsByFacet, results, fn,
      ideo = this;

  if (Object.keys(filters).length == 0) {
    fn = null;
  } else {
    fn = function(d) {
      return d in filters;
    };
  }

  annotsByFacet =
    ideo.crossfilter
      .dimension(function(d) {
        return d[facet];
      })
      .filter(fn);

  results = annotsByFacet.top(Infinity);

  counts = annotsByFacet.group().top(Infinity);

  annotsByFacet.filterAll(); // clear filters
  results = ideo.packAnnots(results);

  d3.selectAll("polygon.annot").remove();
  ideo.drawAnnots(results);

  console.log("Time in filterAnnots: " + (Date.now() - t0) + " ms")

  return counts;
}
