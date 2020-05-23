/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram brush', function() {

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

  it('should create a brush when specified', done => {
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

  it('should have annotations and brushes aligned with base pairs', done => {
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

});
