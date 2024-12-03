
/* eslint-disable no-new */

// Tests use cases from ../examples/vanilla/related-genes

describe('Ideogram related genes kit', function() {

  // Account for latency in Ensembl, MyGene.info, and WikiPathways
  this.timeout(20000);

  d3 = Ideogram.d3;

  beforeEach(function() {
    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  function getFontFamily(selector) {
    const element = document.querySelector(selector);
    return window.getComputedStyle(element).getPropertyValue('font-family');
  }


  it('handles gene with interacting genes but no paralogs', done => {

    async function callback() {
      const ideo = this;

      await ideo.plotRelatedGenes('BRCA2');

      const related = ideo.getRelatedGenesByType();

      const numParalogs = related.paralogous.length;
      const numInteractingGenes = related.interacting.length;

      assert.isAtLeast(numInteractingGenes, 1);
      assert.equal(numParalogs, 0);
      done();
    }

    const config = {
      organism: 'Homo sapiens',
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      cacheDir: '/dist/data/cache/'
    };

    Ideogram.initRelatedGenes(config);
  });

  it('handles searched gene, click, font, interaction summaries', done => {

    async function callback() {
      await ideogram.plotRelatedGenes('RAD51');

      setTimeout(async function() {

        const rad54lLabel = document.querySelector('#_c0_a0 path');
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
            // *are* directionally the same, though not identical in type
            tooltip = document.querySelector('#_ideogramTooltip');
            assert.include(tooltip.textContent, 'Acts on RAD51 in');

            ideogram.plotRelatedGenes('BRCA1');
            setTimeout(function() {
              const bard1Label =
                document.querySelector('#chr2-9606 .annot path');
              bard1Label.dispatchEvent(new Event('mouseover'));

              setTimeout(function() {
                // Test interacting gene summary processing, where interactions
                // *are not* directionally the same
                tooltip = document.querySelector('#_ideogramTooltip');
                assert.include(tooltip.textContent, 'Interacts with BRCA1 in');

                const structureContainer =
                  document.querySelector('._ideoGeneStructureContainer');
                structureContainer.dispatchEvent(new Event('mouseover'));
                const structures =
                  document.querySelectorAll('._ideoGeneStructure');
                assert.equal(structures.length, 1);
                done();
              }, 500);

            }, 500);
          }, 500);
        }, 500);
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
      cacheDir: '/dist/data/cache/',
      onClickAnnot,
      onPlotRelatedGenes,
      onWillShowAnnotTooltip,
      showGeneStructureInTooltip: true,
      showParalogNeighborhoods: true,
      fontFamily: 'serif'
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  // it('handles pathway genes', done => {

  //   async function callback() {
  //     await ideogram.plotRelatedGenes('RAD51');

  //     setTimeout(async function() {

  //       const rad54lLabel = document.querySelector('#_c0_a0 path');
  //       rad54lLabel.dispatchEvent(new Event('mouseover'));
  //       const pathwayLink = document.querySelector('.ideo-pathway-link');
  //       const pathwayName = 'Integrated breast cancer pathway';
  //       assert.equal(pathwayLink.textContent, pathwayName);

  //       // Test interaction gene summary processing, where one gene
  //       // is part of a WikiPathways group
  //       const tooltip = document.querySelector('#_ideogramTooltip');
  //       assert.include(tooltip.textContent, 'Stimulated by RAD51 in');

  //       setTimeout(async function() {
  //         pathwayLink.dispatchEvent(new Event('click'));

  //         setTimeout(async function() {
  //           const brca2Annot =
  //             document.querySelector('#chr13-9606 .annot path');
  //           const brca2Color = brca2Annot.getAttribute('fill');
  //           assert.equal(brca2Color, 'green');
  //           done();
  //         }, 2000);
  //       }, 2000);
  //     }, 5000);
  //   }

  //   function onClickAnnot(annot) {
  //     ideogram.plotRelatedGenes(annot.name);
  //   }

  //   function onWillShowAnnotTooltip(annot) {
  //     const ideo = this;
  //     const analytics = ideo.getTooltipAnalytics(annot, ideo);
  //     assert.equal(analytics.tooltipRelatedType, 'interacting');
  //     return annot;
  //   }

  //   var config = {
  //     organism: 'Homo sapiens', // Also tests standard, non-slugged name
  //     chrWidth: 8,
  //     chrHeight: 90,
  //     chrLabelSize: 10,
  //     annotationHeight: 5,
  //     onLoad: callback,
  //     dataDir: '/dist/data/bands/native/',
  //     cacheDir: '/dist/data/cache/',
  //     onClickAnnot,
  //     onWillShowAnnotTooltip
  //   };

  //   const ideogram = Ideogram.initRelatedGenes(config);
  // });

  // // TODO: Restore this
  // it('handles gene with paralogs but no interacting genes', done => {

  //   async function callback() {
  //     const ideo = this;

  //     await ideogram.plotRelatedGenes('DMC1');

  //     const related = ideo.getRelatedGenesByType();

  //     const numParalogs = related.paralogous.length;
  //     const numInteractingGenes = related.interacting.length;

  //     assert.equal(numInteractingGenes, 0);
  //     assert.isAtLeast(numParalogs, 1);

  //     done();
  //   }

  //   function onClickAnnot(annot) {
  //     ideogram.plotRelatedGenes(annot.name);
  //   }

  //   var config = {
  //     organism: 'Homo sapiens',
  //     onLoad: callback,
  //     dataDir: '/dist/data/bands/native/',
  //     onClickAnnot
  //   };

  //   const ideogram = Ideogram.initRelatedGenes(config);
  // });

  it('handles gene with paralog neighborhoods', done => {

    async function callback() {
      const ideo = this;

      await ideo.plotRelatedGenes('LPL');

      const chr10ParalogNeighborhoods = ideo.annotsOther['9'].annots;
      assert.equal(chr10ParalogNeighborhoods.length, 1);

      done();
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      cacheDir: '/dist/data/cache/',
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
      cacheDir: '/dist/data/cache/',
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

  // If an app only wants to render specific genes (per `annotsInList`),
  // and more than those specific genes are found interacting or paralogous,
  // then ensure Ideogram doesn't display the unspecified genes
  it('can omit genes not in specified list', done => {

    async function callback() {
      await ideogram.plotRelatedGenes('CDK9');
      const annots = document.querySelectorAll('.annot');
      assert.equal(annots.length, 3);
      done();
    }

    var config = {
      organism: 'Homo sapiens',
      onLoad: callback,
      dataDir: '/dist/data/bands/native/'
    };

    const annotsInList = ['CDK9', 'CDK19', 'CDK1'];
    const ideogram = Ideogram.initRelatedGenes(config, annotsInList);
  });

  it('handles default display of highly cited genes', done => {

    function callback() {
      const ideo = this;

      const annots = ideo.flattenAnnots();

      assert.equal(annots.length, 16);
      assert.equal(annots[0].name, 'IL10');

      done();
    }

    const annotsPath =
      '/dist/data/cache/homo-sapiens-top-genes.tsv';

    const config = {
      organism: 'Homo sapiens',
      chrWidth: 8,
      chrHeight: 90,
      chrLabelSize: 10,
      annotationHeight: 5,
      onDrawAnnots: callback,
      dataDir: '/dist/data/bands/native/',
      annotationsPath: annotsPath
    };

    Ideogram.initGeneLeads(config);
  });

});
