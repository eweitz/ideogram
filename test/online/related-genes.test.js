
/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram related genes kit', function() {

  // Account for latency in Ensembl, MyGene.info, and WikiPathways
  this.timeout(25000);

  var config = {};

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('should handle "Related genes" kit', done => {
    // Tests use case from ../examples/vanilla/related-genes

    async function callback() {
      await ideogram.plotRelatedGenes('RAD51');
      done();
    }

    var config = {
      organism: 'homo-sapiens',
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onLoad: callback,
      dataDir: '/dist/data/bands/native/'
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });
});
