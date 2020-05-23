/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

// innerHTML doesn't work for SVG in PhantomJS.  This is a workaround.
//
// TODO: Experiment with removing this; as tests now use headless
// Chrome, not PhantomJS
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

describe('Ideogram ploidy', function() {

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

  it('should show XX chromosomes for a diploid human female', done => {
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

  it('should show XY chromosomes for a diploid human male', done => {
    // Tests use case from ../examples/vanilla/ploidy-basic.html

    function callback() {
      var selector = '#chrX-9606-chromosome-set .chrSetLabel tspan';
      var chrSetLabel = getSvgText(selector);
      assert.equal(chrSetLabel, 'XY');
      done();
    }

    var config = {
      organism: 'human',
      sex: 'male',
      chrHeight: 300,
      chrWidth: 8,
      ploidy: 2,
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };
    var ideogram = new Ideogram(config);
  });

  it('should omit Y chromosome in haploid human female', done => {

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
});
