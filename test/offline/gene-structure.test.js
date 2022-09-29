
/* eslint-disable no-new */

// Tests use cases from ../examples/vanilla/related-genes

describe('Ideogram gene structure functionality', function() {

  // Account for latency
  this.timeout(10000);

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
        assert.equal(subparts.length, 7);
        done();
      }, 500);
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

  it('supports mouse-highlighting and keyboard-navigating subparts', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const apoelLabel = document.querySelector('#ideogramLabel__c18_a1');
        apoelLabel.dispatchEvent(new Event('mouseover'));

        // Mimic real user action
        const container =
          document.querySelector('._ideoGeneStructureContainer');
        container.dispatchEvent(new Event('mouseenter'));

        // Navigate by hovering with cursor
        const subparts = document.querySelectorAll('rect.subpart');
        const exon3 = subparts[4];
        exon3.dispatchEvent(new Event('mouseenter')); // hover over exon
        const footer = document.querySelector('._ideoGeneStructureFooter');
        const exonText = footer.textContent.slice(0, 20);
        assert.equal(exonText, 'Exon 3 of 4 | 193 bp');

        // Navigate subparts by pressing arrow key
        const left = new KeyboardEvent('keydown', {key: 'ArrowLeft'});
        document.dispatchEvent(left);
        console.log(footer.textContent)
        const exonText2 = footer.textContent;
        assert.equal(
          exonText2,
          'Exon 2 of 4 | 66 bp' +
          'Transcript name: APOE-201' +
          'Exons: 4 | Biotype: protein coding | Strand: +'
        );
        done();
      }, 500);
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
