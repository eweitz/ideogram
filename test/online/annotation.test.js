/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram annotations', function() {

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

  it('should have 114 annotations for BED file at remote URL', done => {
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

  it('should have 16 annotations for TSV file', done => {
    // Tests use case from ../examples/vanilla/related-genes

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 16);
      done();
    }

    var config = {
      organism: 'human',
      annotationsPath: '/dist/data/annotations/gene-cache/homo-sapiens-top-genes.tsv',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });


  it('should have 10 annotations for native annots at remote URL', done => {
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
      annotationsPath: 'https://unpkg.com/ideogram@1.5.0/dist/data/annotations/10_virtual_cnvs.json',
      annotationsLayout: 'overlay',
      orientation: 'horizontal',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });
});
