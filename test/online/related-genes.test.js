
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

  it('handles searched gene and annotation click', done => {
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

    function onPlotRelatedGenes() {
      // pass through
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot,
      onPlotRelatedGenes
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with interacting genes but no paralogs', done => {
    // Tests use case from ../examples/vanilla/related-genes

    async function callback() {
      const ideo = this;

      await ideogram.plotRelatedGenes('BRCA2');

      const related = ideo.getRelatedGenesByType();

      const numParalogs = related.paralogous.length;
      const numInteractingGenes = related.interacting.length;

      assert.isAtLeast(numInteractingGenes, 1);
      assert.equal(numParalogs, 0);

      done();
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with paralogs but no interacting genes', done => {
    // Tests use case from ../examples/vanilla/related-genes

    async function callback() {
      const ideo = this;

      await ideogram.plotRelatedGenes('DMC1');

      const related = ideo.getRelatedGenesByType();

      const numParalogs = related.paralogous.length;
      const numInteractingGenes = related.interacting.length;

      assert.equal(numInteractingGenes, 0);
      assert.isAtLeast(numParalogs, 1);

      done();
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with no interacting genes and no paralogs', done => {
    // Tests use case from ../examples/vanilla/related-genes

    async function callback() {
      const ideo = this;

      await ideogram.plotRelatedGenes('BRCA1');

      const related = ideo.getRelatedGenesByType();

      const numParalogs = related.paralogous.length;
      const numInteractingGenes = related.interacting.length;

      assert.equal(numInteractingGenes, 0);
      assert.equal(numParalogs, 0);

      done();
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    var config = {
      organism: 'Macaca mulatta', // Also tests standard, non-slugged name
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

});
