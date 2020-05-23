/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram NCBI', function() {

  this.timeout(10000); // Account for NCBI E-Utils API brownout

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

  it('should support mitochondrial and chloroplast chromosomes', done => {
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

    setTimeout(function() {
      var ideogram = new Ideogram(config);
    }, 1500);
  });

  it('should use GRCh37 when specified in "assembly" parameter', done => {
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

  it('should use GCF_000001405.12 when specified in "assembly" parameter', done => {
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

  it('should support RefSeq accessions in "assembly" parameter', done => {
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

  it('should support using NCBI Taxonomy ID in "organism" option', done => {

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

  it('should show three unbanded, annotated primate genomes in one page', done => {
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

        // Test that default chimpanzee assembly has centromeres
        var chimpanzeeQArmBand = document.querySelectorAll('#chr2A-9598-q1').length;
        assert.equal(chimpanzeeQArmBand, 1);

        // Test that selected human assembly has no cytobands
        var human1Bands = document.querySelectorAll('#chr1-9606 .band').length;

        // 2 bands = p, q.  Fully banded has 63.
        assert.equal(human1Bands, 2);

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
      var ideogram = new Ideogram(config);
    }
  });

  // BEGIN REGRESSED INTEGRATION TESTS
  //
  // 2019-07-29:
  // These tests fail due to an upstream breaking change in NCBI E-Utils.
  // Specifically, the Entrez GenColl database was retired without notice.
  //
  // it('should support GenBank accessions in "assembly" parameter', done => {
  //   // Tests use case for non-default assemblies.
  //   // GCA_000002125.2 is commonly called HuRef
  //   // https://www.ncbi.nlm.nih.gov/assembly/GCA_000002125.2

  //   function callback() {
  //     var chr1Length = ideogram.chromosomes['9606']['1'].length;
  //     // For reference, see length section of LOCUS field in GenBank record at
  //     // https://www.ncbi.nlm.nih.gov/nuccore/CM001609.2
  //     assert.equal(chr1Length, 219475005);
  //     done();
  //   }

  //   config.assembly = 'GCA_000002125.2';
  //   config.onLoad = callback;
  //   console.log('config')
  //   console.log(config)
  //   var ideogram = new Ideogram(config);
  // });

  // it('should recover chromosomes when given scaffolds', done => {
  //   // Tests use case from ../examples/vanilla/eukaryotes?org=sus-scrofa

  //   function callback() {
  //     var numChromosomes = document.querySelectorAll('.chromosome').length;
  //     assert.equal(numChromosomes, 20);
  //     done();
  //   }

  //   var config = {
  //     organism: 'Sus scrofa', // pig
  //     onLoad: callback
  //   };

  //   setTimeout(function() {
  //     var ideogram = new Ideogram(config);
  //   }, 2000);

  // });

  // it('should not have race condition when init is quickly called multiple times', done => {
  //   // Verifies handling for a Plotly use case.
  //   // See https://github.com/eweitz/ideogram/pull/154

  //   /**
  //   * Differences in remotely cached (static) vs. uncached (queried via EUtils)
  //   * response times is the likely cause of the race condition that's tested
  //   * against here.
  //   **/

  //   var numTimesOnLoadHasBeenCalled = 0;

  //   function testRaceCondition() {
  //     var ideo = this;
  //     numTimesOnLoadHasBeenCalled++;
  //     var numChimpChromosomes = 25; // See e.g. https://eweitz.github.io/ideogram/eukaryotes?org=pan-troglodytes
  //     var numHumanChromosomes = 24; // (22,X,Y)
  //     var numChromosomes = ideo.chromosomesArray.length;

  //     if (numTimesOnLoadHasBeenCalled === 1) {
  //       assert.equal(numChromosomes, numChimpChromosomes);
  //     } else if (numTimesOnLoadHasBeenCalled === 2) {
  //       assert.equal(numChromosomes, numHumanChromosomes);
  //       done();
  //     }
  //   }

  //   function startRaceCondition() {
  //     new Ideogram({
  //       organism: 'pan-troglodytes',
  //       dataDir: '/dist/data/bands/native/',
  //       onLoad: testRaceCondition
  //     });
  //     new Ideogram({
  //       organism: 'human',
  //       dataDir: '/dist/data/bands/native/',
  //       onLoad: testRaceCondition
  //     });
  //   }

  //   var ideogram = new Ideogram({
  //     organism: 'human',
  //     dataDir: '/dist/data/bands/native/',
  //     onLoad: startRaceCondition
  //   });
  // });

  // // eweitz, 2018-10-18: This test passes locally and the apicoplast displays
  // // as expected in https://eweitz.github.io/ideogram/eukaryotes?org=plasmodium-falciparum,
  // // but the test fails on Travis CI, e.g. https://travis-ci.org/eweitz/ideogram/builds/443002664
  // // Why?  It seems like a Travis-specific false positive.  Disabling for now.
  // // it('should support apicoplast chromosomes of malaria parasite', done => {
  // //   // Tests use case from ../examples/vanilla/eukaryotes.html

  // //   function callback() {
  // //     var chromosomes = Array.from(document.querySelectorAll('.chromosome'));
  // //     var nonNuclearChrs = chromosomes.slice(-1);
  // //     assert.equal(chromosomes.length, 15);
  // //     assert.equal(nonNuclearChrs[0].id, 'chrAP-5833'); // apicoplast (CP)
  // //     done();
  // //   }

  // //   var config = {
  // //     organism: 'plasmodium-falciparum', // P. falciparum, malaria parasite
  // //     showNonNuclearChromosomes: true,
  // //     onLoad: callback
  // //   };

  // //   var ideogram = new Ideogram(config);
  // // });
  // //
  ////
  // END REGRESSED NCBI INTEGRATION TESTS
  ////
});
