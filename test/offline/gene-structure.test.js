
/* eslint-disable no-new */

// Tests use cases from ../examples/vanilla/related-genes

describe('Ideogram gene structure functionality', function() {

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('shows basic gene structure', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const apoelLabel = document.querySelector('#ideogramLabel__c18_a1');
        apoelLabel.dispatchEvent(new Event('mouseover'));
        const subparts = document.querySelectorAll('rect.subpart');
        assert.equal(subparts.length, 10);
        done();
      }, 200);
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

  it('supports mouse-highlighting subparts', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const apoelLabel = document.querySelector('#ideogramLabel__c18_a1');
        apoelLabel.dispatchEvent(new Event('mouseover'));
        const subparts = document.querySelectorAll('rect.subpart');
        const exon3 = subparts[6];
        exon3.dispatchEvent(new Event('mouseenter')); // hover over exon

        const container =
          document.querySelector('._ideoGeneStructureContainer');
        container.dispatchEvent(new Event('mouseenter'));
        const footer = document.querySelector('._ideoGeneStructureFooter');
        assert.equal(footer.textContent, 'Exon 3 of 4 | 192 bp');

        const left = new KeyboardEvent('keydown', {key: 'ArrowLeft'});
        exon3.dispatchEvent(left);
        done();
      }, 200);
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
