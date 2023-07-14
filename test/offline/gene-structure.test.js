
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
        assert.equal(subparts.length, 7); // spliced, without introns
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

  it('shows basic protein feature organization', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const ldlrLabel = document.querySelector('#ideogramLabel__c18_a0');
        ldlrLabel.dispatchEvent(new Event('mouseover'));
        const subparts = document.querySelectorAll('rect.subpart.domain');
        assert.equal(subparts.length, 22); // Protein features
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
      showProteinInTooltip: true,
      showParalogNeighborhoods: true
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('supports mouse-highlighting and keyboard-navigating subparts', done => {
    async function callback() {

      // Positive-stranded gene
      await ideogram.plotRelatedGenes('APOE');

      setTimeout(async function() {
        const apoeLabel = document.querySelector('#ideogramLabel__c18_a1');
        apoeLabel.dispatchEvent(new Event('mouseover'));

        // Mimic real user action
        const container =
          document.querySelector('._ideoGeneStructureContainer');
        container.dispatchEvent(new Event('mouseenter'));

        // Navigate by hovering with cursor
        let subparts = document.querySelectorAll('rect.subpart');
        const exon3 = subparts[4];
        exon3.dispatchEvent(new Event('mouseenter')); // hover over exon
        let footer = document.querySelector('._ideoGeneStructureFooter');
        const exonText = footer.textContent.slice(0, 20);
        assert.equal(exonText, 'Exon 3 of 4 | 193 bp');

        // Navigate subparts by pressing arrow key
        const left = new KeyboardEvent('keydown', {key: 'ArrowLeft'});
        document.dispatchEvent(left);
        const exonText2 = footer.textContent;
        assert.equal(
          exonText2,
          'Exon 2 of 4 | 66 bp' +
          'Transcript: APOE-201APOE-204APOE-203APOE-202' +
          '4 exons | 1,166 bp '
        );

        // Negative-stranded gene
        const apoa1Label = document.querySelector('#ideogramLabel__c10_a2');
        apoa1Label.dispatchEvent(new Event('mouseover'));

        // Mimic real user action
        container.dispatchEvent(new Event('mouseenter'));

        // Navigate by hovering with cursor
        subparts = document.querySelectorAll('rect.subpart');
        const exon4 = subparts[0];
        exon4.dispatchEvent(new Event('mouseenter')); // hover over exon
        footer = document.querySelector('._ideoGeneStructureFooter');
        const exon4Text = footer.textContent.slice(0, 20);
        assert.equal(exon4Text, 'Exon 4 of 4 | 661 bp');

        // Navigate subparts by pressing arrow key
        document.dispatchEvent(left);
        const exon3Text = footer.textContent.slice(0, 20);
        assert.equal(
          exon3Text,
          'Exon 3 of 4 | 157 bp'
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

  it('toggles exon splice / intron insert', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const apoeLabel = document.querySelector('#ideogramLabel__c18_a1');
        apoeLabel.dispatchEvent(new Event('mouseover'));
        // Press "s" key, to toggle exon splicing
        const sKeydown = new KeyboardEvent('keydown', {key: 's'});
        document.dispatchEvent(sKeydown);
        let subparts = document.querySelectorAll('rect.subpart');
        assert.equal(subparts.length, 10); // includes introns

        document.dispatchEvent(sKeydown);
        setTimeout(async function() {
          // The last exon of gene LDLR includes both CDS and 3'-UTR
          // There was a bug (see commit 7a43ba0) that caused drastically
          // longer apparent CDS in these cases, whereas correct display
          // has a relatively very small CDS compared to 3'-UTR.
          const ldlrLabel = document.querySelector('#ideogramLabel__c18_a0');
          ldlrLabel.dispatchEvent(new Event('mouseover'));
          subparts = document.querySelectorAll('rect.subpart');

          const lastExon = subparts[18];
          const threePrimeUtr = subparts[19];

          assert.equal(Math.round(lastExon.x.baseVal.value), 127);
          assert.equal(Math.round(lastExon.width.baseVal.value), 123);

          assert.equal(Math.round(threePrimeUtr.x.baseVal.value), 129);
          assert.equal(Math.round(threePrimeUtr.width.baseVal.value), 121);

          // Label for MAOA gene
          const maoaLabel = document.querySelector('#ideogramLabel__c22_a0');
          maoaLabel.dispatchEvent(new Event('mouseover'));
          const container =
            document.querySelector('._ideoGeneStructureContainer');
          container.dispatchEvent(new Event('mouseenter'));

          const menu = document.querySelector('#_ideoGeneStructureMenu');
          // MAOA-204, case of exon before first UTR in Ideogram data
          // Happens in 4-10% of transcripts
          // Context: https://github.com/eweitz/ideogram/pull/337
          menu.options[1].selected = true;
          menu.dispatchEvent(new Event('change', {'bubbles': true}));

          document.dispatchEvent(sKeydown);
          setTimeout(async function() {
            const firstUtr = document.querySelector('.five-prime-utr');
            assert.equal(firstUtr.x.baseVal.value, 0);
            assert.equal(Math.round(firstUtr.width.baseVal.value), 4);
            assert.equal(firstUtr.getAttribute('fill'), '#155069');
            done();
          }, 1000);
        }, 1000);
      }, 500);
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      cacheDir: '/dist/data/cache/',
      showGeneStructureInTooltip: true,
      showParalogNeighborhoods: true
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

  it('animates splice for unannotated 5\'-UTR trancscript', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('SREBF1');
      setTimeout(async function() {
        const srebf1Label = document.querySelector('#ideogramLabel__c16_a1');
        srebf1Label.dispatchEvent(new Event('mouseover'));

        // Mimic real user action
        const container =
          document.querySelector('._ideoGeneStructureContainer');
        container.dispatchEvent(new Event('mouseenter'));

        container.dispatchEvent(new Event('mouseenter'));
        const menu = document.querySelector('#_ideoGeneStructureMenu');
        menu.options[4].selected = true;
        menu.dispatchEvent(new Event('change', {'bubbles': true}));

        document.querySelector('._ideoSpliceToggle').click();

        setTimeout(async function() {
          let subparts = document.querySelectorAll('rect.subpart');
          subparts = Array.from(subparts).reverse();
          const subpart1 = subparts[0];
          const x = subpart1.getAttribute('x');
          const width = subpart1.getAttribute('width');
          const color = subpart1.getAttribute('fill');
          assert.equal(Math.round(parseFloat(x)), 247);
          assert.equal(Math.round(parseFloat(width)), 3);
          assert.equal(color, '#DAA521');
          done();
        }, 1000);
      }, 500);
    }

    var config = {
      organism: 'Homo sapiens', // Also tests standard, non-slugged name
      onLoad: callback,
      dataDir: '/dist/data/bands/native/',
      cacheDir: '/dist/data/cache/',
      showGeneStructureInTooltip: true,
      showParalogNeighborhoods: true
    };

    const ideogram = Ideogram.initRelatedGenes(config);
  });

});
