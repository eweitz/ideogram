
/* eslint-disable no-new */

// Tests use cases from ../examples/vanilla/related-genes

describe('Ideogram pathway diagrams functionality', function() {

  // Account for latency
  this.timeout(20000);

  d3 = Ideogram.d3;

  beforeEach(function() {
    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('shows pathway diagram with searched gene in red', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const ldlrLabel = document.querySelector('#_c18_a2 path');
        ldlrLabel.dispatchEvent(new Event('mouseover'));
        setTimeout(async function() {
          const fhSelector = '.ideo-pathway-link[data-pathway-id="WP5110"]';
          const fhPathwayLink = document.querySelector(fhSelector);
          setTimeout(async () => {
            fhPathwayLink.dispatchEvent(new Event('click'));
            setTimeout(async function() {
              const apoeNode = document.querySelector('g.APOE .Icon');
              const apoeColor = getComputedStyle(apoeNode).fill;
              const red = 'rgb(255, 0, 0)';

              // Searched gene should be red in diagram
              assert.equal(apoeColor, red);
              done();
            }, 5000);
          }, 500);
        }, 1000);
      }, 1000);
    }

    function onClickAnnot(annot) {
      ideogram.plotRelatedGenes(annot.name);
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      cacheDir: '/dist/data/cache/',
      onClickAnnot,
      showGeneStructureInTooltip: true,
      showParalogNeighborhoods: true
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

});
