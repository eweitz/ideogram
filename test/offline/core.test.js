/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram', function() {

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

  it('should have a non-body container when specified', function() {
    config.container = '.small-ideogram';
    var ideogram = new Ideogram(config);
    assert.equal(ideogram.config.container, '.small-ideogram');
  });

  it('should write "svg" element to DOM', done => {

    function callback() {
      var svg = document.getElementsByTagName('svg').length;
      // assert.equal(svg, 2); // one for ideogram, one for settings gear
      assert.equal(svg, 1); // one for ideogram
      done();
    }
    config.onLoad = callback;

    var ideogram = new Ideogram(config);
    // var svg = document.getElementsByTagName('svg').length;
    // assert.equal(svg, 1);
  });

  it('should have 24 chromosomes for a human ideogram instance', done => {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes['9606']).length;
      assert.equal(numChromosomes, 24);
      done();
    }

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 21 chromosomes for a mouse ideogram instance', done => {
    // Tests use case from ../examples/vanilla/mouse.html
    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes['10090']).length;
      assert.equal(numChromosomes, 21);
      done();
    }

    // Clears default setting from beforeEach (test artifact)
    delete config.organism;

    // config.taxid = 10090;
    config.organism = 'mouse';
    config.orientation = 'horizontal';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 1000 annotations in basic annotations example', done => {
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

  it('should have 1000 annotations in overlaid annotations example', done => {
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

  it('should have 10 spanning overlaid annotations in proper chromosomes', done => {
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

  it('should have 1000 annotations and legend in annotations example', done => {
    // Tests use case from ../examples/vanilla/annotations-tracks.html
    // TODO: Add class to annots indicating track

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 1000);
      var numLegendRows = document.querySelectorAll('#_ideogramLegend li').length;
      assert.equal(numLegendRows, 3);
      done();
    }

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00'},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC'},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4'}
    ];

    var legend = [{
      name: 'Clinical significance (simulated)',
      rows: [
        {name: 'Pathogenic', color: '#F00'},
        {name: 'Uncertain significance', color: '#CCC'},
        {name: 'Benign', color: '#8D4'}
      ]
    }];

    var config = {
      // taxid: 9606,
      organism: 'human',
      chrWidth: 8,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      legend: legend,
      annotationHeight: 2.5,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should support trackIndex in annotations option', done => {
    // Tests use case from https://github.com/eweitz/ideogram/issues/137

    function callback() {
      annots = d3.selectAll('.annot').nodes();
      transform1 = annots[0].getAttribute('transform');
      transform2 = annots[1].getAttribute('transform');
      assert.equal(transform1, 'translate(0,18)');
      assert.equal(transform2, 'translate(17,28)');
      done();
    }

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00'},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC'},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4'}
    ];

    annots = {
      keys: ['name', 'start', 'length', 'trackIndex'],
      annots: [{chr: '2', annots: [
        ['rs1', 1, 0, 1], // track 1
        ['rs25', 5974955, 0, 2] // track 2
      ]}]};

    var config = {
      // taxid: 9606,
      organism: 'human',
      chrWidth: 8,
      chrHeight: 500,
      annotations: annots,
      annotationTracks: annotationTracks,
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have narrow rectangles as custom annotations shape', done => {
    // Tests use case from ../examples/vanilla/annotations-tracks.html

    function callback() {
      var annot, annot2, box, transform;

      annot = document.querySelector('#chr6-9606 > g:nth-child(7)');
      box = annot.getBBox();

      assert.equal(box.height, 7);
      assert.equal(box.width, 1.75);

      // Ensure distal track of chromosome 1 is visible
      annot2 = document.querySelector('#chr1-9606-chromosome-set');
      transform = annot2.getAttribute('transform');
      assert.equal(transform, 'rotate(90) translate(30, -34)');

      done();
    }

    var annotHeight = 3.5;

    var shape =
      'm0,0 l 0 ' + (2 * annotHeight) +
      'l ' + annotHeight / 2 + ' 0' +
      'l 0 -' + (2 * annotHeight) + 'z';

    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00', shape: shape},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC', shape: shape},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4', shape: shape}
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


  it('should show tooltip upon hovering over annotation ', done => {
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


  it('should have 12 chromosomes per row in small layout example', done => {
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

  it('should handle arrayed objects in "annotations" parameter', done => {
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

  // TODO: Re-enable when there is a decent package that enables
  //       PhantomJS-like screenshots from automated tests
  //       cf.:
  //        if (window.callPhantom) {
  //        callPhantom({'screenshot': filename})
  //
  // it('should align chr. label with thick horizontal chromosome', done => {
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

  it('should align chr. label with vertical chromosome', done => {
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

    var shape = 'circle';
    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00', shape: shape},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC', shape: shape},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4', shape: shape}
    ];

    var legend = [{
      rows: [
        {name: 'Pathogenic', color: '#F00', shape: shape},
        {name: 'Uncertain significance', color: '#CCC', shape: shape},
        {name: 'Benign', color: '#8D4', shape: shape}
      ]
    }];

    var config = {
      organism: 'human',
      chrWidth: 20,
      chrHeight: 500,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      annotationHeight: 2.5,
      legend: legend,
      dataDir: '/dist/data/bands/native/'
    };
    config.onDrawAnnots = callback;
    var ideogram = new Ideogram(config);
  });

  it('should show three human genomes in one page', done => {
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
      var ideogram = new Ideogram(config);
    }

  });

  // This test is flaky in Travis CI.
  // Disabled until a way to detect Travis environment is found.
  // it('should show border of band-labeled chromosome when multiple ideograms exist', done => {
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


  it('should depict chromosomal rearrangements', done => {
    // Covers case in ../examples/vanilla/ploidy-rearrangements.html
    function callback() {
      // TODO: There shouldn't be multiple elements with the same id
      var lastCopyChr1 = d3.selectAll('#chr1-4641').nodes().slice(-1)[0];
      lastCopyChr1Fill = d3.select(lastCopyChr1).select('.p-band').nodes()[0].style.fill;
      assert.equal(lastCopyChr1Fill, 'transparent');
      done();
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
      ],
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  it('should depict chromosomal rangesets', done => {
    // Covers case in ../examples/vanilla/ploidy-recombination.html

    function callback() {
      // TODO: There shouldn't be multiple elements with the same id
      var numRangeSets = d3.selectAll('.range-set rect').nodes().length;
      assert.equal(numRangeSets, 6);
      done();
    }

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
      }],
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  // it('should align chr. label with band-labeled vertical chromosome', done => {
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

  it('should add "Authentication: Bearer" when access token is provided', done => {
    // Tests use case from ../examples/vanilla/auth.html

    // Monkey patch the fetch method to intercept request and inspect HTTP
    // "Authorization" header for test access token.
    var originalFetch = window.fetch;
    window.fetch = function() {
      if (arguments.length > 1 && /googleapis/.test(arguments[0])) {
        var bearer = arguments[1].headers.get('authorization');
        assert.equal(bearer, 'Bearer mockAccessToken');
        done();
        return; // Don't send request for remote resource, as test passed
      }
      return originalFetch.apply(this, arguments);
    };

    var accessToken = 'mockAccessToken';

    config = {
      organism: 'human',
      orientation: 'vertical',
      chromosome: '1',
      chrHeight: 450,
      showBandLabels: false,
      heatmapThresholds: [0, 0.13, 0.27, 0.4, 0.53, 0.67, 0.8, 0.93, 1.1, 1.2, 1.33, 1.47, 1.6, 1.73, 1.87, 2],
      annotationHeight: 3,
      accessToken: accessToken,
      annotationsLayout: 'heatmap-2d',
      annotationsPath: 'https://www.googleapis.com/storage/v1/b/ideogram-dev/o/oligodendroglioma%2finfercnv.observations.optimized.txt?alt=media',
      dataDir: '/dist/data/bands/native/'
    };

    ideogram = new Ideogram(config);
  });

  it('should properly render q-telocentric chromosomes', done => {
    // Tests use case from ../examples/vanilla/eukaryotes?org=macaca-mulatta

    function callback() {
      var chrYParts =
        document.querySelectorAll('#chrY-9544 .chromosome-border path');

      var pArm = chrYParts[0].getBoundingClientRect();
      assert.isBelow(Math.abs(23.6 - pArm.height), 1);

      var centromere = chrYParts[1].getBoundingClientRect();
      assert.isBelow(Math.abs(4.25 - centromere.height), 1);

      var qArm = chrYParts[2].getBoundingClientRect();
      assert.isBelow(Math.abs(2 - qArm.height), 1);

      done();
    }

    var config = {
      organism: 'macaca-mulatta', // Rhesus macaque
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  it('should sort chromosomes with Roman numeral names', done => {
    // Tests use case from ../examples/vanilla/eukaryotes?org=saccharomyces-cerevisiae
    // Verifies fix for https://github.com/eweitz/ideogram/issues/223

    function callback() {
      var chrs = document.querySelectorAll('.chromosome-set');
      assert.equal(chrs[9].id, 'chrX-4932-chromosome-set');
      done();
    }

    var config = {
      organism: 'saccharomyces-cerevisiae', // Baker's yeast
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

});
