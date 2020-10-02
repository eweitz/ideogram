
/* eslint-disable no-new */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram related genes kit', function() {

  // Account for latency in Ensembl, MyGene.info, and WikiPathways
  this.timeout(25000);

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('should handle "Related genes" kit', done => {
    // Tests use case from ../examples/vanilla/related-genes

    async function callback() {
      await ideogram.plotRelatedGenes('RAD51');

      const brca2Annot = document.querySelector('#chr13-9606 .annot path');
      brca2Annot.dispatchEvent(new Event('mouseover'));

      const relatedGene = document.querySelector('#ideo-related-gene');

      assert.equal(relatedGene.textContent, 'BRCA2');

      const click = new MouseEvent('click', {view: window, bubbles: true});
      relatedGene.dispatchEvent(click);

      done();
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    var config = {
      organism: 'homo-sapiens',
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot: onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });
});
