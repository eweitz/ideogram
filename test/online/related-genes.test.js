
/* eslint-disable no-new */

// Tests use cases from ../examples/vanilla/related-genes

describe('Ideogram related genes kit', function() {

  // Account for latency in Ensembl, MyGene.info, and WikiPathways
  this.timeout(25000);

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  function getFontFamily(selector) {
    const element = document.querySelector(selector);
    return window.getComputedStyle(element).getPropertyValue('font-family');
  }

  it('handles searched gene, click, font, interaction summaries', done => {

    async function callback() {
      await ideogram.plotRelatedGenes('RAD51');

      const rad54lLabel = document.querySelector('#ideogramLabel__c0_a0');
      rad54lLabel.dispatchEvent(new Event('mouseover'));
      let relatedGene = document.querySelector('#ideo-related-gene');
      assert.equal(relatedGene.textContent, 'RAD54L');

      // Wait a second to account for fetching interaction details
      setTimeout(async function() {

        // Test interaction gene summary processing, where one gene
        // is part of a WikiPathways group
        let tooltip = document.querySelector('#_ideogramTooltip');
        assert.include(tooltip.textContent, 'Stimulated by RAD51 in');

        rad54lLabel.dispatchEvent(new Event('mouseout'));

        const brca2Annot = document.querySelector('#chr13-9606 .annot path');
        brca2Annot.dispatchEvent(new Event('mouseover'));
        setTimeout(async function() {
          relatedGene = document.querySelector('#ideo-related-gene');

          assert.equal(relatedGene.textContent, 'BRCA2');

          // Test interacting gene summary processing, where interactions
          // *are not* directionally the same
          tooltip = document.querySelector('#_ideogramTooltip');
          assert.include(tooltip.textContent, 'Acts on RAD51 in');

          ideogram.plotRelatedGenes('ABL1');

          setTimeout(function() {
            const atmLabel = document.querySelector('#ideogramLabel__c10_a0');
            atmLabel.dispatchEvent(new Event('mouseover'));

            setTimeout(function() {
              // Test interacting gene summary processing, where interactions
              // *are* directionally the same, though not identical in type
              tooltip = document.querySelector('#_ideogramTooltip');
              assert.include(tooltip.textContent, 'Acts on ABL1 in');

              relatedGene = document.querySelector('#ideo-related-gene');
              const click = new MouseEvent('click', {
                view: window, bubbles: true
              });
              relatedGene.dispatchEvent(click);

              done();
            }, 4000);

          }, 1000);
        }, 1000);
      }, 1000);
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    function onPlotRelatedGenes() {
      const legendFontFamily = getFontFamily('#_ideogramLegend');
      assert.equal(legendFontFamily, 'serif');
      assert.equal(getFontFamily('.chrLabel'), 'serif');
    }

    function onWillShowAnnotTooltip(annot) {
      const ideo = this;
      const analytics = ideo.getTooltipAnalytics(annot, ideo);
      assert.equal(analytics.tooltipRelatedType, 'interacting');
      return annot;
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
      onPlotRelatedGenes,
      onWillShowAnnotTooltip,
      fontFamily: 'serif'
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with interacting genes but no paralogs', done => {

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
      organism: 'Homo sapiens',
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with paralogs but no interacting genes', done => {

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
      organism: 'Homo sapiens',
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with no interacting genes and no paralogs', done => {

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
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles gene with no interacting genes and no paralogs', done => {
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
      organism: 'Macaca mulatta',
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      onClickAnnot
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });


  it('handles gene that is unknown', done => {

    async function callback() {
      try {
        await ideogram.plotRelatedGenes('Foo');
      } catch (error) {
        assert.equal(
          error.message,
          '"Foo" is not a known gene in Homo sapiens'
        );
        done();
      }
    }

    var config = {
      organism: 'Homo sapiens',
      onLoad: callback,
      dataDir: '/dist/data/bands/native/'
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('handles default display of highly cited genes', done => {

    async function callback() {
      const ideo = this;

      const annots = ideo.flattenAnnots();

      assert.equal(annots.length, 16);
      assert.equal(annots[0].name, 'IL10');

      done();
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    const annotsPath =
      '/dist/data/cache/homo-sapiens-top-genes.tsv';

    var config = {
      organism: 'Homo sapiens',
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onDrawAnnots: callback,
      dataDir: '/dist/data/bands/native/',
      annotationsPath: annotsPath,
      onClickAnnot
    };

    const ideogram = Ideogram.initGeneHints(config);
  });

});
