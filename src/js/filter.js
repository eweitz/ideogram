import {d3} from './lib';
import crossfilter from 'crossfilter2';

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
function unpackAnnots() {
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
function packAnnots(unpackedAnnots) {
  var chr, annot, i,
    annots = [],
    ideo = this,
    chrs = ideo.annots;

  for (chr in chrs) {
    annots.push({chr: chrs[chr].chr, annots: []});
  }

  for (i = 0; i < unpackedAnnots.length; i++) {
    annot = unpackedAnnots[i];
    annots[annot.chrIndex].annots.push(annot);
  }

  return annots;
}

/*
  Initializes crossfilter.  Needed for client-side filtering.
  More: https://github.com/square/crossfilter/wiki/API-Reference
*/
function initCrossFilter() {
  var i, facet,
    ideo = this,
    keys = ideo.rawAnnots.keys;

  ideo.unpackedAnnots = ideo.unpackAnnots();
  ideo.crossfilter = crossfilter(ideo.unpackedAnnots);

  ideo.annotsByFacet = {};
  ideo.facets = keys.slice(3, keys.length);

  for (i = 0; i < ideo.facets.length; i++) {
    facet = ideo.facets[i];
    ideo.annotsByFacet[facet] =
      ideo.crossfilter.dimension(function(d) {
        return d[facet];
      });
  }

  if ('filterSelections' in ideo) {
    ideo.filterAnnots(ideo.filterSelections);
  }

  ideo.filteredAnnots = ideo.annots;
}

function getFilteredResults(selections, ideo) {
  var fn, i, facet, results, filter,
    counts = {};

  if (Object.keys(selections).length === 0) {
    results = ideo.unpackedAnnots;
  } else {
    for (i = 0; i < ideo.facets.length; i++) {
      facet = ideo.facets[i];
      if (facet in selections) {
        filter = selections[facet];
        if (Array.isArray(filter)) {
          fn = function(d) {
            // Filter is numeric range
            if (filter.length === 2) {
              // [min, max]
              return filter[0] <= d && d < filter[1];
            } else if (filter.length === 4) {
              // [min1, max1, min2, max2]
              return (
                filter[0] <= d && d < filter[1] ||
                filter[2] <= d && d < filter[3]
              );
            }
          };
        } else {
          fn = function(d) {
            // Filter is set of categories
            return (d in filter);
          };
        }
      } else {
        fn = null;
      }
      ideo.annotsByFacet[facet].filter(fn);
      counts[facet] = ideo.annotsByFacet[facet].group().top(Infinity);
    }
    results = ideo.annotsByFacet[facet].top(Infinity);
  }

  return [results, counts];
}

/*
  Filters annotations based on the given selections.
  "selections" is an object of objects, e.g.

    {
      "tissue-type": {          <-- a facet
        "cerebral-cortex": 1,   <-- a filter; "1" means it is selected
        "liver": 1
      },
      "gene-type": {
        mirna": 1
      }
    }

  Translation:
  select where:
      (tissue-type is cerebral-cortex OR liver) and (gene-type is mirna)

  TODO:
    * Filter counts
    * Integrate server-side filtering for very large datasets
*/
function filterAnnots(selections) {
  var i, facet, results, counts,
    t0 = Date.now(),
    ideo = this;

  ideo.filterSelections = selections;
  [results, counts] = getFilteredResults(selections, ideo);

  for (i < 0; i < ideo.facets.length; i++) {
    ideo.annotsByFacet[facet].filterAll(); // clear filters
  }

  results = ideo.packAnnots(results);

  delete ideo.maxAnnotsPerBar;
  delete ideo.maxAnnotsPerBarAllChrs;

  ideo.filteredAnnots = results;

  d3.selectAll(ideo.selector + ' polygon.annot').remove();
  ideo.drawAnnots(results);

  console.log('Time in filterAnnots: ' + (Date.now() - t0) + ' ms');

  return counts;
}

export {unpackAnnots, packAnnots, initCrossFilter, filterAnnots};
