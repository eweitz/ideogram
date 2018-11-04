// Most of these tests use Mocha's async support.
// Helpful:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

// innerHTML doesn't work for SVG in PhantomJS.  This is a workaround.
function getSvgText(selector) {
  var svgText =
    new XMLSerializer()
      .serializeToString(
        document.querySelector(selector)
      )
      .split('>')[1]
      .split('</')[0];
  return svgText;
}

describe('Ideogram', function() {

  var config = {};

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('svg').remove();
    d3.selectAll('#_ideogramOuterWrap').remove();

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

  it('should have a non-body container when specified', function() {
    config.container = '.small-ideogram';
    var ideogram = new Ideogram(config);
    assert.equal(ideogram.config.container, '.small-ideogram');
  });

  it('should write "svg" element to DOM', function(done) {

    function callback() {
      var svg = document.getElementsByTagName('svg').length;
      assert.equal(svg, 1);
      done();
    }
    config.onLoad = callback;

    var ideogram = new Ideogram(config);
    // var svg = document.getElementsByTagName('svg').length;
    // assert.equal(svg, 1);
  });

  it('should have 24 chromosomes for a human ideogram instance', function(done) {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes["9606"]).length;
      assert.equal(numChromosomes, 24);
      done();
    }

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 21 chromosomes for a mouse ideogram instance', function(done) {
    // Tests use case from ../examples/vanilla/mouse.html

    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes["10090"]).length;
      assert.equal(numChromosomes, 21);
      done();
    }

    // Clears default setting from beforeEach (test artifact)
    delete config.organism;

    config.taxid = 10090;
    config.orientation = 'horizontal';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 4 syntenic regions for basic homology example', function(done) {
    // Tests use case from ../examples/vanilla/homology-basic.html

    function callback() {

      var chrs = ideogram.chromosomes,
        chr1 = chrs['9606']['1'],
        chr2 = chrs['9606']['2'],
        r1Band, r2Band,
        r3Band, r4Band,
        r5Band, r6Band,
        range1, range2, range3, range4, range5, range6,
        syntenicRegions = [];

      r1Band = chr1.bands[2];
      range1 = {
        chr: chr1,
        start: r1Band.bp.start,
        stop: r1Band.bp.stop
      };

      r2Band = chr2.bands[2];
      range2 = {
        chr: chr2,
        start: r2Band.bp.start,
        stop: r2Band.bp.stop
      };

      // 1p11, chromosome 1 centromeric p band
      r3Band = chr1.bands[22];
      range3 = {
        chr: chr1,
        start: r3Band.bp.start,
        stop: r3Band.bp.stop
      };

      // 2p11.1, chromosome 2 centromeric p band
      r4Band = chr2.bands[13];
      range4 = {
        chr: chr2,
        start: r4Band.bp.start,
        stop: r4Band.bp.stop
      };

      // 1q12
      r5Band = chr1.bands[24];
      range5 = {
        chr: chr1,
        start: r5Band.bp.start,
        stop: r5Band.bp.stop
      };

      // 2q22
      r6Band = chr2.bands[24];
      range6 = {
        chr: chr2,
        start: r6Band.bp.start,
        stop: r6Band.bp.stop
      };

      // 1q24
      r7Band = chr1.bands[29];
      range7 = {
        chr: chr1,
        start: r7Band.bp.start,
        stop: r7Band.bp.stop
      };

      // 2q31 - 2q33
      range8 = {
        chr: chr2,
        start: chr2.bands[29].bp.start,
        stop: chr2.bands[33].bp.stop
      };

      syntenicRegions.push(
        {r1: range1, r2: range2},
        {r1: range3, r2: range4},
        {r1: range5, r2: range6},
        {r1: range7, r2: range8}
      );

      ideogram.drawSynteny(syntenicRegions);

      var numChromosomes = Object.keys(ideogram.chromosomes['9606']).length;
      assert.equal(numChromosomes, 2);

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      assert.equal(numSyntenicRegions, 4);

      done();
    }

    config.chromosomes = ['1', '2'];
    config.showBandLabels = true;
    config.orientation = 'vertical';
    config.perspective = 'comparative';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 25 syntenic regions for advanced example', function(done) {
    // Tests use case from ../examples/vanilla/homology-advanced.html

    function callback() {

      var chrs = ideogram.chromosomes,
        chr1 = chrs['10090']['1'],
        chr2 = chrs['10090']['2'],
        r1Band = chr1.bands[8],
        r2Band = chr2.bands[18],
        range1, range2, range3, range4, range5, range6,
        syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: r1Band.bp.start,
        stop: r1Band.bp.stop
      };

      for (var i = 1; i < 20; i++) {
        range2 = {
          chr: chr2,
          start: 6000000 * i,
          stop: 6500000 * i
        };
        syntenicRegions.push({r1: range1, r2: range2, color: '#F55'});
      }

      var range3 = {
        chr: chr1,
        start: 125000000,
        stop: 126000000
      };

      range4 = {
        chr: chr2,
        start: 1500000 * i,
        stop: 3600000 * i
      };
      syntenicRegions.push({r1: range3, r2: range4, opacity: 0.7});

      var range5 = {
        chr: chr2,
        start: r2Band.bp.start,
        stop: r2Band.bp.stop
      };

      for (var i = 1; i < 6; i++) {
        range6 = {
          chr: chr1,
          start: 120000000 + (12000000 * i),
          stop: 120000000 + (8000000 * i)
        };
        color = '#AAF';
        if (i === 5) {
          color = '#DDD';
        }
        syntenicRegions.push({r1: range5, r2: range6, color: color});
      }

      ideogram.drawSynteny(syntenicRegions);

      var numChromosomes = Object.keys(ideogram.chromosomes['10090']).length;
      assert.equal(numChromosomes, 2);

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      assert.equal(numSyntenicRegions, 25);

      var srID = '#chr1-10090_54516053_55989459___chr2-10090_114000000_123500000';
      var otherSrID = '#chr1-10090_54516053_55989459___chr2-10090_108000000_117000000';

      var sr = d3.select(srID);
      var otherSr = d3.select(otherSrID);
      sr.dispatch('mouseover');
      var otherSrIsTranslucent = /ghost/.test(otherSr.nodes()[0].classList.value);
      assert.equal(otherSrIsTranslucent, true);
      sr.dispatch('mouseout');

      sr.dispatch('click');
      var otherSrIsHidden = /hidden/.test(otherSr.nodes()[0].classList.value);
      assert.equal(otherSrIsHidden, true);

      done();
    }

    config = {
      taxid: 10090,
      chromosomes: ['1', '2'],
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 200,
      showChromosomeLabels: true,
      showBandLabels: true,
      orientation: 'vertical',
      perspective: 'comparative',
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  it('should have 1 syntenic region between a human and a mouse chromosome', function(done) {
    // Tests use case from ../examples/vanilla/homology-interspecies.html

    function callback() {
      // See HomoloGene entry for MTOR at
      // http://www.ncbi.nlm.nih.gov/homologene/3637
      // Placements for H. sapiens and M. musculus used below.
      // Placements from latest annotation release in
      // Human: http://www.ncbi.nlm.nih.gov/gene/2475#genomic-context
      // Mouse: http://www.ncbi.nlm.nih.gov/gene/56717#genomic-context

      var chrs = ideogram.chromosomes,
        chr1 = chrs['9606']['1'],
        chr4 = chrs['10090']['4'],
        syntenicRegions = [],
        range1, range2;

      range1 = {
        chr: chr1,
        start: 11106531,
        stop: 11262557,
        orientation: 'reverse'
      };

      range2 = {
        chr: chr4,
        start: 148448582,
        stop: 148557685
      };

      syntenicRegions.push({r1: range1, r2: range2});

      ideogram.drawSynteny(syntenicRegions);

      var numHumanChromosomes = Object.keys(ideogram.chromosomes['9606']).length;
      assert.equal(numHumanChromosomes, 1, 'numHumanChromosomes');

      var numMouseChromosomes = Object.keys(ideogram.chromosomes['10090']).length;
      assert.equal(numMouseChromosomes, 1, 'numMouseChromosomes');

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      // console.log(d3.selectAll('.syntenicRegion'));

      console.log(document.getElementsByClassName('syntenicRegion')[0][0]);

      assert.equal(numSyntenicRegions, 1, 'numSyntenicRegions');

      done();
    }

    config.organism = ['human', 'mouse'];
    config.chromosomes = {
      human: ['1'],
      mouse: ['4']
    };
    config.orientation = 'vertical';
    config.perspective = 'comparative';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 1000 annotations in basic annotations example', function(done) {
    // Tests use case from ../examples/vanilla/annotations-basic.html

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 1000);
      done();
    }

    config.annotationsPath = '../dist/data/annotations/1000_virtual_snvs.json';
    config.annotationsNumTracks = 3;

    config.onDrawAnnots = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 1000 annotations in overlaid annotations example', function(done) {
    // Tests use case from old ../examples/vanilla/annotations-overlaid.html

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 1000);
      done();
    }

    config = {
      organism: 'human',
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 5,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationsLayout: 'overlay',
      orientation: 'horizontal',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have 10 spanning overlaid annotations in proper chromosomes', function(done) {
    // Tests:
    //  * https://github.com/eweitz/ideogram/issues/65
    //  * https://github.com/eweitz/ideogram/issues/66

    function callback() {

      // Correct number?
      var numAnnots = document.querySelectorAll('.annot').length;
      assert.equal(numAnnots, 10);

      // Correct order?
      var numChr20Annots = document.querySelectorAll('#chr20-9606 .annot').length;
      assert.equal(numChr20Annots, 1);

      // Spanning, not point?
      var chr1Annot = document.querySelectorAll('#chr1-9606 .annot')[0];
      var chr1AnnotWidth = chr1Annot.getBBox().width;
      assert.isAbove(chr1AnnotWidth, 3);

      done();
    }

    config = {
      organism: 'human',
      annotationsPath: '../dist/data/annotations/10_virtual_cnvs.json',
      annotationsLayout: 'overlay',
      orientation: 'horizontal',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have 1000 annotations and 5 tracks in tracks annotations example', function(done) {
    // Tests use case from ../examples/vanilla/annotations-tracks.html
    // TODO: Add class to annots indicating track

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 1000);
      done();
    }

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00'},
      {id: 'likelyPathogenicTrack', displayName: 'Likely pathogenic', color: '#DB9'},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC'},
      {id: 'likelyBenignTrack', displayName: 'Likely benign', color: '#BD9'},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4'}
    ];

    var config = {
      taxid: 9606,
      chrWidth: 8,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      annotationHeight: 2.5,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have properly scaled annotations after rotating', function(done) {
    // Tests use case from ../examples/vanilla/annotations-tracks.html

    function callback() {

      console.log('in web-test callback')
      var annot, annotBox;

      annot = document.getElementsByClassName('annot')[3];
      annotBox = annot.getBoundingClientRect();

      assert.isBelow(Math.abs(annotBox.x - 75), 2);
      assert.isBelow(Math.abs(annotBox.y - 510), 2);
      assert.isBelow(Math.abs(annotBox.height - 14), 2);
      assert.isBelow(Math.abs(annotBox.right - 89), 2);
      assert.isBelow(Math.abs(annotBox.bottom - 523), 2);
      assert.isBelow(Math.abs(annotBox.left - 75), 2);

      done();
    }

    // Click chromosome 1 after it's loaded and had time to draw annotations.
    function loadCallback() {
      console.log('in web-test loadCallback')
      setTimeout(function() {
        d3.select('#chr1-9606').dispatch('click');
      }, 200);
    }

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00'},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC'},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4'}
    ];

    var config = {
      organism: 'human',
      chrWidth: 8,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      annotHeight: 3.5,
      dataDir: '/dist/data/bands/native/',
      onLoad: loadCallback,
      onDidRotate: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have filterable annotations', function(done) {
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
      var tmp, checkedFilter, checkedFilters,  i, facet, counts, count,
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

  it('should have filterable tracks in track-filters example', function(done) {
    // Tests use case from ../examples/vanilla/annotations-track-filters.html

    var firstRun = true;

    function callback() {

      if (firstRun) {
        firstRun = false;
      } else {
        return;
      }

      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 696);

      // Filters tracks to show only 4th and 5th track (of 20)
      ideogram.updateDisplayedTracks([4, 5]);
      numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 620);

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

  it('should have 2015 annotations in histogram annotations example', function(done) {
    // Tests use case from ../examples/vanilla/annotations-histogram.html
    // TODO: Add class to annots indicating track

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 2015);
      done();
    }

    var config = {
      organism: 'human',
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/all_human_genes.json',
      annotationsLayout: 'histogram',
      barWidth: 3,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have narrow rectangles as custom annotations shape', function(done) {
    // Tests use case from ../examples/vanilla/annotations-tracks.html

    function callback() {
      var annot, box;

      annot = document.querySelector('#chr6-9606 > g:nth-child(7)');
      box = annot.getBBox();

      assert.equal(box.height, 7);
      assert.equal(box.width, 1.75);

      done();
    }

    var annotHeight = 3.5;

    var shape =
      'm0,0 l 0 ' + (2 * annotHeight) +
      'l ' + annotHeight/2 + ' 0' +
      'l 0 -' + (2 * annotHeight) + 'z';

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00', shape: shape},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC', shape: shape},
      {id: 'benignTrack',  displayName: 'Benign', color: '#8D4', shape: shape},
    ];

    var config = {
      organism: 'human',
      orientation: 'vertical',
      chrWidth: 8,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      annotationHeight: annotHeight,
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });


  it('should have 114 annotations for BED file at remote URL', function(done) {
    // Tests use case from ../examples/vanilla/annotations-file-url.html

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 114);
      done();
    }

    var config = {
      organism: 'human',
      assembly: 'GRCh37',
      annotationsPath: 'https://raw.githubusercontent.com/NCBI-Hackathons/Scan2CNV/master/files/201113910010_R08C02.PennCnvOut.bed',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have 10 annotations for native annots at remote URL', function(done) {
    // Tests use case from ../examples/vanilla/annotations-file-url.html

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 10);
      done();
    }

    var config = {
      organism: 'human',
      chrHeight: 300,
      chrMargin: 2,
      annotationsPath: 'https://unpkg.com/ideogram@0.15.0/dist/data/annotations/10_virtual_cnvs.json',
      annotationsLayout: 'overlay',
      orientation: 'horizontal',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have two heatmap tracks for each chromosome', function(done) {
    // Tests use case from ../examples/vanilla/annotations-heatmap.html

    function callback() {
      var numHeatmaps = document.querySelectorAll('canvas').length;
      var chr1HeatmapTrackTwo = document.querySelectorAll('canvas#chr1-9606-canvas-1').length;
      assert.equal(numHeatmaps, 48);
      assert.equal(chr1HeatmapTrackTwo, 1);
      done();
    }

    document.getElementsByTagName('body')[0].innerHTML +=
      '<div id="container"></div>';

    var annotationTracks = [
      {id: 'expressionLevelTrack', displayName: 'Expression level'},
      {id: 'geneTypeTrack', displayName: 'Gene type'},
    ];

    var config = {
      container: '#container',
      organism: 'human',
      assembly: 'GRCh37',
      chrHeight: 275,
      annotationsPath: '../dist/data/annotations/SRR562646.json',
      annotationsLayout: 'heatmap',
      heatmaps: [
        {
          key: 'expression-level',
          thresholds: [['0', '#AAA'], ['3', '#88F'], ['+', '#F33']]
        },
        {
          key: 'gene-type',
          thresholds: [['0', '#00F'], ['1', '#0AF'], ['2', '#AAA'], ['3', '#FA0'], ['4', '#F00']]
        }
      ],
      annotationTracks: annotationTracks,
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should show tooltip upon hovering over annotation ', function(done) {
    // Tests use case from ../examples/vanilla/annotations-basic.html

    function callback() {
      d3.select('.annot path').dispatch('mouseover');
      var content = d3.select('._ideogramTooltip').html();
      assert.equal(content, 'BRCA1<br>chr17:43,044,294-43,125,482');
      d3.select('.annot path').dispatch('mouseout');
      done();
    }

    var config = {
      organism: 'human',
      chromosome: '17',
      chrHeight: 600,
      orientation: 'horizontal',
      annotations: [{
        name: 'BRCA1',
        chr: '17',
        start: 43044294,
        stop: 43125482
      }],
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have histogram bars roughly flush with chromosome ends', function(done) {
    // Tests use case from ../examples/vanilla/annotations-histogram.html
    // TODO: Add class to annots indicating track

    function getTerEnd(arm) {
      // Helper function to get the x coordinate of the outermost
      // edge of the p or q arm of chromosome 1
      var armIndex = (arm === 'p') ? 1 : 2,
        ter = d3.selectAll('.chromosome-border path:nth-child(' + armIndex + ')'),
        terEnd,
        inst = ter.attr('d').split(' '), // Path instructions in description ('d')
        terCurve = parseInt(inst[4].replace('Q', '').split(',')[0]),
        terCurveX = parseInt(inst[0].replace('M', '').split(',')[0]),
        terStroke = parseFloat(ter.style("stroke-width").slice(0, -2));

      if (arm === 'p') {
        terEnd = terCurve;
      } else {
        terEnd = terCurve + terCurveX - terStroke;
      }

      terEnd = terEnd.toFixed(2);

      return terEnd;
    }

    function onIdeogramLoadAnnots() {

      var pterEnd = getTerEnd("p"),
        firstAnnotEnd = d3.selectAll("#chr1-9606 .annot").nodes()[0].getBBox().x,
        qterEnd = getTerEnd("q"),
        tmp = d3.selectAll("#chr1-9606 .annot").nodes(),
        tmp = tmp[tmp.length - 1].getBBox(),
        lastAnnotEnd = tmp.x + tmp.width;

      // console.log("pterEnd - firstAnnotEnd: " + (pterEnd - firstAnnotEnd));
      // console.log("qterEnd - lastAnnotEnd: " + (qterEnd - lastAnnotEnd));
      assert.isBelow(pterEnd - firstAnnotEnd, -1);
      assert.isAbove(qterEnd - lastAnnotEnd, -19);

      done();
    }

    var config = {
      organism: 'human',
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/all_human_genes.json',
      annotationsLayout: 'histogram',
      barWidth: 3,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: onIdeogramLoadAnnots
    };

    ideogram = new Ideogram(config);
  });

  it('should have annotations and brushes aligned with base pairs', function(done) {
    // Tests fix for https://github.com/eweitz/ideogram/issues/91
    // and related issues.

    function getLeft(selector) {
      return Math.round(document
        .querySelector(selector)
        .getBoundingClientRect().x);
    }

    function getRight(selector) {
      return Math.round(document
        .querySelector(selector)
        .getBoundingClientRect().right);
    }

    var config = {
      organism: 'human',
      assembly: 'GRCh37',
      chrHeight: 800,
      dataDir: '/dist/data/bands/native/',

      annotationsLayout: 'histogram',
      chromosomes: ['17'],

      brush: 'chr17:5000000-10000000',
      onBrushMove: function() {},
      onLoad: function() {
        this.createBrush('17', 1, 2);
        this.createBrush('17', 40900000, 44900000);
        this.createBrush('17', 81094108, 81094109);

        // Closest test for https://github.com/eweitz/ideogram/issues/91
        var bandQ2131Left = getLeft('#chr17-9606-q21-31');
        var bandQ2131AnnotLeft = getLeft('#chr17-9606 .annot:nth-child(191)');
        var bandQ2131BrushLeft = getLeft('#_ideogram > g:nth-child(6) > rect.selection');
        assert.equal(bandQ2131AnnotLeft, bandQ2131Left);
        assert.equal(bandQ2131AnnotLeft, bandQ2131BrushLeft);

        // Check alignment at far left
        var firstBpAnnotLeft = getLeft('#chr17-9606 > .annot:nth-child(51)');
        var firstBpSliderLeft = getLeft('#_ideogram > g:nth-child(5) > rect.selection');
        var firstBpLeft = getLeft('#chr17-9606');
        assert.equal(firstBpAnnotLeft, firstBpSliderLeft);
        assert.equal(firstBpSliderLeft, firstBpLeft);

        // Check alignment at far right
        var lastBpAnnotRight = getRight('#chr17-9606 > .annot:nth-child(317)');
        var lastBpSliderRight = getRight('#_ideogram > g:nth-child(7) > rect.selection');
        var lastBpRight = getRight('#chr17-9606');
        assert.isBelow(Math.abs(lastBpAnnotRight - lastBpSliderRight), 3);
        assert.isBelow(Math.abs(lastBpSliderRight - lastBpRight), 3);

        done();
      },

      orientation: 'horizontal',
      showBandLabels: true, // only work in horizontal mode

      annotations: [{
        name: 'first_band',
        chr: '17',
        start: 1,
        stop: 2
      },
      {
        name: 'band_q21-31',
        chr: '17',
        start: 40900000,
        stop: 40900001
      },
      {
        name: 'last_band_start',
        chr: '17',
        start: 75300000,
        stop: 75300001
      },
      {
        name: 'last_band_stop',
        chr: '17',
        start: 81195208,
        stop: 81195209
      }]
    };

    var ideogram = new Ideogram(config);
  });

  it('should have 12 chromosomes per row in small layout example', function(done) {
    // Tests use case from ../examples/vanilla/layout-small.html

    function callback() {

      t1 = d3.select('#chr12-9606-chromosome-set').attr('transform');
      t2 = d3.select('#chr13-9606-chromosome-set').attr('transform');

      lastChrRow1Y = parseInt(t1.split('translate(')[1].split(',')[0], 10);
      firstChrRow2Y = parseInt(t2.split('translate(')[1].split(',')[0], 10);

      assert.isTrue(firstChrRow2Y > lastChrRow1Y + config.chrHeight);

      done();
    }

    document.getElementsByTagName('body')[0].innerHTML +=
      '<div class="small-ideogram"></div>';

    var config = {
      container: '.small-ideogram',
      organism: 'human',
      resolution: 550,
      chrWidth: 10,
      chrHeight: 150,
      chrMargin: 10,
      rows: 2,
      showChromosomeLabels: true,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/'
    };

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should use GRCh37 when specified in "assembly" parameter', function(done) {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      var bands = ideogram.chromosomes['9606']['1'].bands;
      var chr1Length = bands[bands.length - 1].bp.stop;
      assert.equal(chr1Length, 249250621);
      done();
    }

    config.assembly = 'GRCh37';
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should use GCF_000001405.12 when specified in "assembly" parameter', function(done) {
    // Tests use case from ../examples/vanilla/human.html with NCBI36 / hg18

    function callback() {
      var bands = ideogram.chromosomes['9606']['1'].bands;
      var chr1Length = bands[bands.length - 1].bp.stop;
      assert.equal(chr1Length, 247249719);
      done();
    }

    config.assembly = 'GCF_000001405.12';
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should support RefSeq accessions in "assembly" parameter', function(done) {
    // Tests use case for non-default assemblies.
    // GCF_000306695.2 is commonly called CHM1_1.1
    // https://www.ncbi.nlm.nih.gov/assembly/GCF_000306695.2/

    function callback() {
      var chr1Length = ideogram.chromosomes['9606']['1'].length;
      // For reference, see length section of LOCUS field in GenBank record at
      // https://www.ncbi.nlm.nih.gov/nuccore/CM001609.2
      assert.equal(chr1Length, 250522664);
      done();
    }

    config.assembly = 'GCF_000306695.2';
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should support GenBank accessions in "assembly" parameter', function(done) {
    // Tests use case for non-default assemblies.
    // GCA_000002125.2 is commonly called HuRef
    // https://www.ncbi.nlm.nih.gov/assembly/GCA_000002125.2

    function callback() {
      var chr1Length = ideogram.chromosomes['9606']['1'].length;
      // For reference, see length section of LOCUS field in GenBank record at
      // https://www.ncbi.nlm.nih.gov/nuccore/CM001609.2
      assert.equal(chr1Length, 219475005);
      done();
    }

    config.assembly = 'GCA_000002125.2';
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should recover chromosomes when given scaffolds', function(done) {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      var numChromosomes = document.querySelectorAll('.chromosome').length;
      assert.equal(numChromosomes, 20);
      done();
    }

    var config = {
      organism: 'Sus scrofa', // pig
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  it('should support mitochondrial and chloroplast chromosomes', function(done) {
    // Tests use case from ../examples/vanilla/eukaryotes.html

    function callback() {
      var chromosomes = Array.from(document.querySelectorAll('.chromosome'));
      var nonNuclearChrs = chromosomes.slice(-2);
      assert.equal(chromosomes.length, 21);
      assert.equal(nonNuclearChrs[0].id, 'chrCP-29760'); // chloroplast (CP)
      assert.equal(nonNuclearChrs[1].id, 'chrMT-29760'); // mitochrondrion (MT)
      done();
    }

    var config = {
      organism: 'vitis-vinifera', // grape
      showNonNuclearChromosomes: true,
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  // eweitz, 2018-10-18: This test passes locally and the apicoplast displays
  // as expected in https://eweitz.github.io/ideogram/eukaryotes?org=plasmodium-falciparum,
  // but the test fails on Travis CI, e.g. https://travis-ci.org/eweitz/ideogram/builds/443002664
  // Why?  It seems like a Travis-specific false positive.  Disabling for now.
  // it('should support apicoplast chromosomes of malaria parasite', function(done) {
  //   // Tests use case from ../examples/vanilla/eukaryotes.html

  //   function callback() {
  //     var chromosomes = Array.from(document.querySelectorAll('.chromosome'));
  //     var nonNuclearChrs = chromosomes.slice(-1);
  //     assert.equal(chromosomes.length, 15);
  //     assert.equal(nonNuclearChrs[0].id, 'chrAP-5833'); // apicoplast (CP)
  //     done();
  //   }

  //   var config = {
  //     organism: 'plasmodium-falciparum', // P. falciparum, malaria parasite
  //     showNonNuclearChromosomes: true,
  //     onLoad: callback
  //   };

  //   var ideogram = new Ideogram(config);
  // });

  it('should handle arrayed objects in "annotations" parameter', function(done) {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      var numAnnots = d3.selectAll('.annot').nodes().length;
      assert.equal(numAnnots, 1);
      done();
    }

    config.annotations = [{
      name: 'BRCA1',
      chr: '17',
      start: 43044294,
      stop: 43125482
    }];
    config.onDrawAnnots = callback;
    var ideogram = new Ideogram(config);
  });

  it('should create a brush when specified', function(done) {
    // Tests use case from ../examples/vanilla/brush.html

    function callback() {
      assert.equal(ideogram.selectedRegion.from, 5000000);
      assert.equal(ideogram.selectedRegion.to, 10000000);
      assert.equal(ideogram.selectedRegion.extent, 5000000);
      assert.equal(d3.selectAll('.selection').nodes().length, 1);
      done();
    }

    var config = {
      organism: 'human',
      chromosome: '19',
      brush: 'chr19:5000000-10000000',
      chrHeight: 900,
      orientation: 'horizontal',
      onBrushMove: callback, // placeholder
      onLoad: callback,
      dataDir: '/dist/data/bands/native/'
    };
    var ideogram = new Ideogram(config);
  });

  // TODO: Re-enable when there is a decent package that enables
  //       PhantomJS-like screenshots from automated tests
  //       cf.:
  //        if (window.callPhantom) {
  //        callPhantom({'screenshot': filename})
  //
  // it('should align chr. label with thick horizontal chromosome', function(done) {
  //   // Tests use case from ../examples/vanilla/annotations_basic.html
  //
  //   function callback() {
  //     var band, bandMiddle,
  //         chrLabel, chrLabelMiddle;
  //
  //     band = d3.selectAll(".chromosome .band").nodes()[0].getBoundingClientRect();
  //     chrLabel = d3.selectAll(".chrSetLabel").nodes()[0].getBoundingClientRect();
  //
  //     bandMiddle = band.top + band.height/2;
  //     chrLabelMiddle = chrLabel.top + chrLabel.height/2;
  //
  //     labelsDiff = Math.abs(bandMiddle - chrLabelMiddle);
  //
  //     assert.isAtMost(labelsDiff, 1);
  //     done();
  //   }
  //
  //   config = {
  //     organism: 'human',
  //     chrHeight: 600,
  //     chrWidth: 20,
  //     orientation: 'horizontal',
  //     chromosomes: ["17"],
  //     annotations: [{
  //       "name": "BRCA1",
  //       "chr": "17",
  //       "start": 43044294,
  //       "stop": 43125482
  //     }],
  //     annotationHeight: 6
  //   };
  //   config.onDrawAnnots = callback;
  //   var ideogram = new Ideogram(config);
  // });

  it('should align chr. label with vertical chromosome', function(done) {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      var band, bandMiddle,
        chrLabel, chrLabelMiddle;

      band = d3.selectAll('.chromosome .band').nodes()[0].getBoundingClientRect();
      chrLabel = d3.selectAll('.chrLabel').nodes()[0].getBoundingClientRect();

      bandMiddle = band.left + band.width / 2;
      chrLabelMiddle = chrLabel.left + chrLabel.width / 2;

      labelsDiff = Math.abs(bandMiddle - chrLabelMiddle);

      assert.isAtMost(labelsDiff, 1);
      done();
    }

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00'},
      {id: 'likelyPathogenicTrack', displayName: 'Likely pathogenic', color: '#DB9'},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC'},
      {id: 'likelyBenignTrack', displayName: 'Likely benign', color: '#BD9'},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4'}
    ];

    var config = {
      organism: 'human',
      chrWidth: 20,
      chrHeight: 500,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      annotationHeight: 2.5,
      dataDir: '/dist/data/bands/native/'
    };
    config.onDrawAnnots = callback;
    var ideogram = new Ideogram(config);
  });

  it('should show three human genomes in one page', function(done) {
    // Tests use case from ../examples/vanilla/multiple-trio.html

    var config, containerIDs, id, i, container,
      ideogramsLoaded = 0;

    function callback() {
      var numChromosomes;

      ideogramsLoaded += 1;

      if (ideogramsLoaded === 3) {
        numChromosomes = document.querySelectorAll('.chromosome').length;
        assert.equal(numChromosomes, 24 * 3);
        done();
      }
    }

    config = {
      organism: 'human',
      chrHeight: 125,
      resolution: 400,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    containerIDs = ['mother', 'father', 'proband'];
    for (i = 0; i < containerIDs.length; i++) {
      id = containerIDs[i];
      container = '<div id="' + id + '"></div>';
      document.querySelector('body').innerHTML += container;
      config.container = '#' + id;
      new Ideogram(config);
    }

  });

  it('should show three unbanded, annotated primate genomes in one page', function(done) {
    // Tests use case from ../examples/vanilla/multiple-primates.html

    var config, containerIDs, id, i, container,
      ideogramsLoaded = 0,
      annotSetsDrawn = 0;

    function callback() {
      var numChromosomes;

      ideogramsLoaded += 1;
      if (ideogramsLoaded === 3) {
        numChromosomes = document.querySelectorAll('.chromosome').length;
        assert.equal(numChromosomes, 24 + 25 + 21);
      }
    }

    function onDrawAnnotsCallback() {
      var numAnnots;

      annotSetsDrawn += 1;
      if (annotSetsDrawn === 3) {
        numAnnots = document.querySelectorAll('.annot').length;
        assert.equal(numAnnots, 6);
        console.log('done?')
        done();
      }
    }

    var orgConfigs = [
      {
        organism: 'homo-sapiens',
        annotations: [
          {name: 'APOB', chr: '2', start: 21001429, stop: 21044073, color: '#F00'},
          {name: 'CTLA4', chr: '2', start: 203867788, stop: 203873960, color: '#77F', shape: 'circle'}
        ]
      },
      {
        organism: 'pan-troglodytes',
        annotations: [
          {name: 'APOB', chr: '2A', start: 21371172, stop: 21413720, color: '#F00'},
          {name: 'CTLA4', chr: '2B', start: 94542849, stop: 94550230, color: '#77F', shape: 'circle'}
        ]
      },
      {
        organism: 'macaca-fascicularis',
        annotations: [
          {name: 'APOB', chr: '13', start: 89924186, stop: 89966894, color: '#F00'},
          {name: 'CTLA4', chr: '12', start: 93412707, stop: 93419132, color: '#77F', shape: 'circle'}
        ]
      }
    ];

    config = {
      chrHeight: 250,
      chrMargin: 2,
      orientation: 'horizontal',
      showFullyBanded: false,
      dataDir: '/dist/data/bands/native/',
      onLoad: callback,
      onDrawAnnots: onDrawAnnotsCallback
    };

    containerIDs = ['homo-sapiens', 'pan-troglodytes', 'macaca-fascicularis'];
    for (i = 0; i < containerIDs.length; i++) {
      id = containerIDs[i];
      container = '<div id="' + id + '"></div>';
      document.querySelector('body').innerHTML += container;
      config.container = '#' + id;
      config.organism = id;
      config.annotations = orgConfigs[i].annotations;
      new Ideogram(config);
    }

  });

  // This test is flaky in Travis CI.
  // Disabled until a way to detect Travis environment is found.
  // it('should show border of band-labeled chromosome when multiple ideograms exist', function(done) {
  //   // Tests fix for https://github.com/eweitz/ideogram/issues/96
  //
  //   var config1, ideogram1, config2, ideogram2, width;
  //
  //   function callback() {
  //     width =
  //       document
  //         .querySelectorAll('#chr7-9606-example2 .chromosome-border path')[1]
  //         .getBBox().width;
  //
  //     width = Math.round(width);
  //
  //     console.log('495 - width')
  //     console.log(495 - width)
  //
  //     assert.equal(495 - width, 0);
  //
  //     console.log('ok')
  //
  //     done();
  //   }
  //
  //   document.querySelector('body').innerHTML +=
  //     '<div id="example1"></div>' +
  //     '<div id="example2"></div>';
  //
  //   config1 = {
  //     container: '#example1',
  //     organism: 'human',
  //     orientation: 'horizontal',
  //     dataDir: '/dist/data/bands/native/',
  //     annotations: [
  //       {
  //         chr: '2',
  //         start: 34294,
  //         stop: 125482
  //       },
  //       {
  //         chr: '17',
  //         start: 43125400,
  //         stop: 43125482
  //       }
  //     ]
  //   };
  //
  //   ideogram1 = new Ideogram(config1);
  //
  //   config2 = {
  //     container: '#example2',
  //     organism: 'human',
  //     chromosome: '7',
  //     orientation: 'horizontal',
  //     annotations: [
  //       {
  //         chr: '7',
  //         start: 199999,
  //         stop: 3000000
  //       },
  //       {
  //         chr: '7',
  //         start: 6000000,
  //         stop: 9000000
  //       }
  //     ],
  //     annotationsLayout: 'overlay',
  //     dataDir: '/dist/data/bands/native/',
  //     onDrawAnnots: callback
  //   };
  //
  //   ideogram2 = new Ideogram(config2);
  //
  // });


  it('should show XX chromosomes for a diploid human female', function(done) {
    // Tests use case from ../examples/vanilla/ploidy-basic.html

    function callback() {
      var selector = '#chrX-9606-chromosome-set .chrSetLabel tspan';
      var chrSetLabel = getSvgText(selector);
      assert.equal(chrSetLabel, 'XX');
      done();
    }

    var config = {
      organism: 'human',
      sex: 'female',
      chrHeight: 300,
      chrWidth: 8,
      ploidy: 2,
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };
    var ideogram = new Ideogram(config);
  });

  it('should show XY chromosomes for a diploid human male', function(done) {
    // Tests use case from ../examples/vanilla/ploidy-basic.html

    function callback() {
      var selector = '#chrX-9606-chromosome-set .chrSetLabel tspan';
      var chrSetLabel = getSvgText(selector);
      assert.equal(chrSetLabel, 'XY');
      done();
    }

    var config = {
      organism: 'human',
      sex: "male",
      chrHeight: 300,
      chrWidth: 8,
      ploidy: 2,
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };
    var ideogram = new Ideogram(config);
  });

  it('should omit Y chromosome in haploid human female', function(done) {

    function callback() {
      var hasChrY = d3.selectAll('#chrY-9606').nodes().length >= 1;
      assert.isFalse(hasChrY);
      done();
    }

    var config = {
      organism: 'human',
      sex: 'female',
      dataDir: '/dist/data/bands/native/'
    };
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should support using NCBI Taxonomy ID in "organism" option', function(done) {

    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes[9606]).length;
      assert.equal(numChromosomes, 24);
      done();
    }

    var config = {
      organism: 9606,
      dataDir: '/dist/data/bands/native/'
    };
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should handle toggling single- and multi-chromosome view, in vertical orientation', function(done) {

    function callback() {

      d3.select('#chr1-9606').dispatch('click');

      var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
        return d.style.display !== 'none';
      });
      var shownChrID = shownChrs[0].id;
      assert.equal(shownChrs.length, 1);
      assert.equal(shownChrID, 'chr1-9606');

      d3.select('#chr1-9606').dispatch('click');
      setTimeout(function() {

        var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
          return d.style.display !== 'none';
        });
        assert.equal(shownChrs.length, 24);

        done();
      }, 500);

    }

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should handle toggling single- and multi-chromosome view, in horizontal orientation', function(done) {

    function callback() {

      d3.select('#chr1-9606').dispatch('click');

      var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
        return d.style.display !== 'none';
      });
      var shownChrID = shownChrs[0].id;
      assert.equal(shownChrs.length, 1);
      assert.equal(shownChrID, 'chr1-9606');
      d3.select('#chr1-9606').dispatch('click');
      setTimeout(function() {
        var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
          return d.style.display !== 'none';
        });
        assert.equal(shownChrs.length, 24);

        done();
      }, 500);
    }

    config.onLoad = callback;
    config.orientation = 'horizontal';
    var ideogram = new Ideogram(config);
  });

  it('should handle toggling single- and multi-chromosome view, in labeled vertical orientation', function(done) {
    // Tests that band labels remain visible after rotating vertical chromosomes

    function callback() {

      d3.select('#chr1-9606').dispatch('click');

      var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
        return d.style.display !== 'none';
      });
      var shownChrID = shownChrs[0].id;
      assert.equal(shownChrs.length, 1);
      assert.equal(shownChrID, 'chr1-9606');
      d3.select('#chr1-9606').dispatch('click');
      setTimeout(function() {

        var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
          return d.style.display !== 'none';
        });

        assert.equal(shownChrs.length, 24);

        var band = d3.select('.bandLabel.bsbsl-0');
        var bandRect = band.nodes()[0].getBoundingClientRect();

        assert.isBelow(Math.abs(bandRect.x - 13), 2);
        assert.isBelow(Math.abs(bandRect.y - 1604), 2);

        done();
      }, 500);
    }

    var config = {
      organism: 'human',
      showBandLabels: true,
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  it('should depict chromosomal rearrangements', function(done) {
    // Covers case in ../examples/vanilla/ploidy-rearrangements.html
    function callback() {
      // TODO: There shouldn't be multiple elements with the same id
      var lastCopyChr1 = d3.selectAll('#chr1-4641').nodes().slice(-1)[0];
      lastCopyChr1Fill = d3.select(lastCopyChr1).select('.p-band').nodes()[0].style.fill;
      assert.equal(lastCopyChr1Fill, 'transparent');
      done();
    }

    function initIdeo() {
      if (typeof bandTimeout !== 'undefined') {
        window.clearTimeout(bandTimeout);
      }

      var config = {
        organism: 'banana',
        orientation: 'horizontal',
        ploidy: 3,
        ancestors: {
          A: '#dea673',
          B: '#7396be'
        },
        ploidyDesc: [
          {AABB: ['11', '11', '11', '02']},
          {AAB: ['01', '11', '11']},
          'BAB',
          {AABB: ['11', '11', '11', '20']},
          'AAB',
          'BBB',
          {AAB: ['01', '11', '11']},
          'AAB',
          'AAB',
          'AAB',
          'AAB'
        ]
      };

      config.onLoad = callback;
      var ideogram = new Ideogram(config);
    }

    d3.select('body')
      .append('script')
      .attr('src', '/dist/data/bands/native/banana.js');

    // Check for banana.js content every 50 ms.
    // If/when that content exists, initialize ideogram.
    (function checkBandData() {
      window.bandTimeout = setTimeout(function() {
        if (typeof (window.chrBands) === 'undefined') {
          checkBandData();
        } else {
          initIdeo();
        }
      }, 50);
    })();

  });

  it('should depict chromosomal rangesets', function(done) {
    // Covers case in ../examples/vanilla/ploidy-recombination.html

    function callback() {
      // TODO: There shouldn't be multiple elements with the same id
      var numRangeSets = d3.selectAll('.range-set rect').nodes().length;
      assert.equal(numRangeSets, 6);
      done();
    }

    function initIdeo() {

      var config = {
        organism: 'banana',
        orientation: 'horizontal',
        ploidy: 3,
        chrMargin: 10,
        ancestors: {
          A: '#dea673',
          B: '#7396be'
        },
        ploidyDesc: [
          'AAB',
          'AAB',
          'BAB',
          'AAB',
          'AAB',
          'BBB',
          'AAB',
          'AAB',
          'AAB',
          'AAB',
          'AAB'
        ],
        rangeSet: [{
          chr: 1,
          ploidy: [0, 1, 0],
          start: 17120000,
          stop: 25120000,
          color: [0, '#7396be', 0]
        }, {
          chr: 2,
          ploidy: [0, 1, 1],
          start: 12120000,
          stop: 15120000,
          color: [0, '#7396be', '#dea673']
        }]
      };

      config.onLoad = callback;
      config.debug = true;
      var ideogram = new Ideogram(config);
    }

    d3.select('body')
      .append('script')
      .attr('src', '/dist/data/bands/native/banana.js');

    // Check for banana.js content every 50 ms.
    // If/when that content exists, initialize ideogram.
    (function checkBandData() {
      window.bandTimeout = setTimeout(function() {
        if (typeof (window.chrBands) === 'undefined') {
          checkBandData();
        } else {
          initIdeo();
        }
      }, 50);
    })();

  });

  // it('should align chr. label with band-labeled vertical chromosome', function(done) {
  //   // Tests use case from ../examples/vanilla/human.html
  //
  //   function callback() {
  //
  //     var band, bandMiddle,
  //         chrLabel, chrLabelMiddle;
  //
  //     band = d3.select(".chromosome .band").nodes()[0].getBoundingClientRect();
  //     chrLabel = d3.select(".chromosome .chrLabel").nodes()[0].getBoundingClientRect();
  //
  //     bandMiddle = band.left + band.width/2;
  //     chrLabelMiddle = chrLabel.left + chrLabel.width/2;
  //
  //     labelsDiff = Math.abs(bandMiddle - chrLabelMiddle);
  //
  //     assert.isAtMost(labelsDiff, 1);
  //     done();
  //   }
  //
  //   var config = {
  //     organism: 'human',
  //     showBandLabels: true,
  //     chrHeight: 500
  //   };
  //   config.onLoad = callback;
  //   var ideogram = new Ideogram(config);
  // });

});
