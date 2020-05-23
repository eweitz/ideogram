/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

describe('Ideogram filter support', function() {

  var config = {};

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();

    config = {
      organism: 'human',
      chrWidth: 10,
      chrHeight: 150,
      chrMargin: 10,
      showChromosomeLabels: true,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/'
    };
  });

  function takeScreenshot() {
    if (window.callPhantom) {
      var date = new Date();
      var filename = 'screenshots/' + date.getTime();
      console.log('Taking screenshot ' + filename);
      callPhantom({screenshot: filename});
    }
  }

  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      takeScreenshot();
    }
  });

  it('should have filterable annotations', done => {
    // Tests use case from ../examples/vanilla/annotations-histogram.html

    var priorBody = document.querySelector('body').innerHTML;

    var firstRun = true;
    var numAnnotsInFirstBar;

    // Ensure the first histogram bar represents
    // 110 annotations before filtering, and
    // 2 annotations after filtering
    function callback() {

      numAnnotsInFirstBar = ideogram.bars[0].annots[0].count;

      if (firstRun) {
        assert.equal(numAnnotsInFirstBar, 110);
        firstRun = false;
        document.querySelector('#filter_expression-level_extremely-high').click();
        return;
      }

      assert.equal(numAnnotsInFirstBar, 2);
      document.querySelector('body').innerHTML = priorBody;
      done();
    }

    var htmlScaffolding = '<div id="container"></div>' +
      '<ul id="expression-level">' +
      'Expression level' +
    '<li>' +
    '<label for="filter_expression-level_extremely-high">' +
      '<input type="checkbox" id="filter_expression-level_extremely-high">Extremely high</input>' +
    '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_expression-level_very-high">' +
      '<input type="checkbox" id="filter_expression-level_very-high">Very high</input>' +
    '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_expression-level_high">' +
      '<input type="checkbox" id="filter_expression-level_high">High</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_expression-level_moderately-high">' +
      '<input type="checkbox" id="filter_expression-level_moderately-high">Moderately high</input>' +
    '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_expression-level_moderate">' +
      '<input type="checkbox" id="filter_expression-level_moderate">Moderate</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_expression-level_low">' +
      '<input type="checkbox" id="filter_expression-level_low">Low</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_expression-level_very-low">' +
      '<input type="checkbox" id="filter_expression-level_very-low">Very low</input>' +
    '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '</ul>' +
      '<ul id="gene-type">' +
      'Gene type' +
    '<li>' +
    '<label for="filter_gene-type_mrna">' +
      '<input type="checkbox" id="filter_gene-type_mrna">mRNA</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_gene-type_misc-rna">' +
      '<input type="checkbox" id="filter_gene-type_misc-rna">misc_RNA</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_gene-type_mirna">' +
      '<input type="checkbox" id="filter_gene-type_mirna">miRNA</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_gene-type_trna">' +
      '<input type="checkbox" id="filter_gene-type_trna">tRNA</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '<li>' +
      '<label for="filter_gene-type_lncrna">' +
      '<input type="checkbox" id="filter_gene-type_lncrna">lncRNA</input>' +
      '<span class="count"></span>' +
      '</label>' +
      '</li>' +
      '</ul>';

    document.querySelector('body').innerHTML = htmlScaffolding;

    var filterMap = {
      'expression-level': {
        'extremely-high': 7,
        'very-high': 6,
        'high': 5,
        'moderately-high': 4,
        'moderate': 3,
        'low': 2,
        'very-low': 1
      },
      'gene-type': {
        'mrna': 1,
        'misc-rna': 2,
        'mirna': 3,
        'trna': 4,
        'lncrna': 5
      },
      'tissue-type': {
        'cerebral-cortex': 1,
        'heart': 2,
        'liver': 3,
        'skin': 4,
        'skeletal-muscle': 5
      }
    };

    d3.selectAll('input').on('click', function() {
      var tmp, checkedFilter, checkedFilters, i, facet, counts, count,
        filterID, key,
        selections = {};

      checkedFilters = d3.selectAll('input:checked').nodes();

      for (i = 0; i < checkedFilters.length; i++) {
        tmp = checkedFilters[i].id.split('_');
        facet = tmp[1];
        checkedFilter = tmp[2];

        filterID = filterMap[facet][checkedFilter];
        if (facet in selections === false) {
          selections[facet] = {};
        }
        selections[facet][filterID] = 1;
      }

      counts = ideogram.filterAnnots(selections);

      for (facet in counts) {
        for (i = 0; i < counts[facet].length; i++) {
          count = counts[facet][i];
          key = count.key - 1;
          value = '(' + count.value + ')';

          // document.querySelectorAll('#' + facet + ' .count')[key].innerHTML = value;
        }
      }
    });

    var config = {
      container: '#container',
      orientation: 'vertical',
      organism: 'human',
      assembly: 'GRCh37',
      chrHeight: 275,
      annotationsPath: '/dist/data/annotations/SRR562646.json',
      dataDir: '/dist/data/bands/native/',
      annotationsLayout: 'histogram',
      barWidth: 3,
      filterable: true,
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have filterable tracks in track filters example', done => {
    // Tests use case from ../examples/vanilla/annotations-track-filters.html

    var firstRun = true;

    function callback() {

      if (firstRun) {
        firstRun = false;
      } else {
        return;
      }

      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 707);

      // Filters tracks to show only 4th and 5th track (of 9)
      ideogram.updateDisplayedTracks([4, 5]);
      numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 635);

      done();
    }

    var config = {
      organism: 'human',
      annotationsPath: '../dist/data/annotations/9_tracks_virtual_snvs.json',
      dataDir: '/dist/data/bands/native/',
      annotationsNumTracks: 3,
      annotationsDisplayedTracks: [1, 5, 9],
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should filter heatmap tracks and show track labels', done => {
    // Tests use case from ../examples/vanilla/annotations-track-filters.html

    var firstRun = true;

    function callback() {

      var track1, track2, track3;

      if (firstRun) {
        firstRun = false;
      } else {
        return;
      }

      d3.select('#chr2-9606-canvas-0').dispatch('mouseover');
      var trackLabel = d3.select('#_ideogramTrackLabel').html();
      assert.equal(trackLabel, 'Sample A<br>Sample E<br>Sample I');

      track1 = document.querySelector('#chr2-9606-canvas-0').getBoundingClientRect();
      track2 = document.querySelector('#chr2-9606-canvas-1').getBoundingClientRect();
      track3 = document.querySelector('#chr2-9606-canvas-2').getBoundingClientRect();

      assert.equal(track1.x, 95);
      assert.equal(track2.x, 104);
      assert.equal(track3.x, 113);

      // Filters tracks to show only 4th and 5th track (of 9)
      ideogram.updateDisplayedTracks([4, 5]);

      track1 = document.querySelector('#chr2-9606-canvas-0').getBoundingClientRect();
      track2 = document.querySelector('#chr2-9606-canvas-1').getBoundingClientRect();

      assert.equal(track1.x, 104);
      assert.equal(track2.x, 113);

      done();
    }

    var config = {
      organism: 'human',
      annotationsPath: '../dist/data/annotations/9_tracks_virtual_snvs.json',
      dataDir: '/dist/data/bands/native/',
      annotationsNumTracks: 3,
      annotationsDisplayedTracks: [1, 5, 9],
      onDrawAnnots: callback,
      annotationsLayout: 'heatmap'
    };

    ideogram = new Ideogram(config);
  });
});
