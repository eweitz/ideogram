/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

describe('Ideogram synteny support', function() {

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

  it('should have 4 syntenic regions for basic homology example', done => {
    // Tests use case from ../examples/vanilla/homology-basic.html

    function callback() {

      var chrs = ideogram.chromosomes,
        chr1 = chrs['9606']['1'],
        chr2 = chrs['9606']['2'],
        r1Band, r2Band,
        r3Band, r4Band,
        r5Band, r6Band,
        range1, range2, range3, range4, range5, range6,
        syntenicRegions = [];

      r1Band = chr1.bands[2];
      range1 = {
        chr: chr1,
        start: r1Band.bp.start,
        stop: r1Band.bp.stop
      };

      r2Band = chr2.bands[2];
      range2 = {
        chr: chr2,
        start: r2Band.bp.start,
        stop: r2Band.bp.stop
      };

      // 1p11, chromosome 1 centromeric p band
      r3Band = chr1.bands[22];
      range3 = {
        chr: chr1,
        start: r3Band.bp.start,
        stop: r3Band.bp.stop
      };

      // 2p11.1, chromosome 2 centromeric p band
      r4Band = chr2.bands[13];
      range4 = {
        chr: chr2,
        start: r4Band.bp.start,
        stop: r4Band.bp.stop
      };

      // 1q12
      r5Band = chr1.bands[24];
      range5 = {
        chr: chr1,
        start: r5Band.bp.start,
        stop: r5Band.bp.stop
      };

      // 2q22
      r6Band = chr2.bands[24];
      range6 = {
        chr: chr2,
        start: r6Band.bp.start,
        stop: r6Band.bp.stop
      };

      // 1q24
      r7Band = chr1.bands[29];
      range7 = {
        chr: chr1,
        start: r7Band.bp.start,
        stop: r7Band.bp.stop
      };

      // 2q31 - 2q33
      range8 = {
        chr: chr2,
        start: chr2.bands[29].bp.start,
        stop: chr2.bands[33].bp.stop
      };

      syntenicRegions.push(
        {r1: range1, r2: range2},
        {r1: range3, r2: range4},
        {r1: range5, r2: range6},
        {r1: range7, r2: range8}
      );

      ideogram.drawSynteny(syntenicRegions);

      var numChromosomes = Object.keys(ideogram.chromosomes['9606']).length;
      assert.equal(numChromosomes, 2);

      var numSyntenicRegions =
        document.getElementsByClassName('syntenicRegion').length;
      assert.equal(numSyntenicRegions, 4);

      done();
    }

    config.chromosomes = ['1', '2'];
    config.showBandLabels = true;
    config.orientation = 'vertical';
    config.perspective = 'comparative';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 25 syntenic regions for advanced example', done => {
    // Tests use case from ../examples/vanilla/homology-advanced.html

    function callback() {

      var chrs = ideogram.chromosomes,
        chr1 = chrs['10090']['1'],
        chr2 = chrs['10090']['2'],
        r1Band = chr1.bands[8],
        r2Band = chr2.bands[18],
        range1, range2, range3, range4, range5, range6, i,
        syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: r1Band.bp.start,
        stop: r1Band.bp.stop
      };

      for (i = 1; i < 20; i++) {
        range2 = {
          chr: chr2,
          start: 6000000 * i,
          stop: 6500000 * i
        };
        syntenicRegions.push({r1: range1, r2: range2, color: '#F55'});
      }

      range3 = {
        chr: chr1,
        start: 125000000,
        stop: 126000000
      };

      range4 = {
        chr: chr2,
        start: 1500000 * 19,
        stop: 3600000 * 19
      };
      syntenicRegions.push({r1: range3, r2: range4, opacity: 0.7});

      range5 = {
        chr: chr2,
        start: r2Band.bp.start,
        stop: r2Band.bp.stop
      };

      for (i = 1; i < 6; i++) {
        range6 = {
          chr: chr1,
          start: 120000000 + (12000000 * i),
          stop: 120000000 + (8000000 * i)
        };
        color = '#AAF';
        if (i === 5) {
          color = '#DDD';
        }
        syntenicRegions.push({r1: range5, r2: range6, color: color});
      }

      ideogram.drawSynteny(syntenicRegions);

      var numChromosomes = Object.keys(ideogram.chromosomes['10090']).length;
      assert.equal(numChromosomes, 2);

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      assert.equal(numSyntenicRegions, 25);

      var srID = '#chr1-10090_54516053_55989459___chr2-10090_114000000_123500000';
      var otherSrID = '#chr1-10090_54516053_55989459___chr2-10090_108000000_117000000';

      var sr = d3.select(srID);
      var otherSr = d3.select(otherSrID);
      sr.dispatch('mouseover');
      var otherSrIsTranslucent = /ghost/.test(otherSr.nodes()[0].classList.value);
      assert.equal(otherSrIsTranslucent, true);
      sr.dispatch('mouseout');

      sr.dispatch('click');
      var otherSrIsHidden = /hidden/.test(otherSr.nodes()[0].classList.value);
      assert.equal(otherSrIsHidden, true);

      done();
    }

    config = {
      // taxid: 10090,
      organism: 'mouse',
      chromosomes: ['1', '2'],
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 200,
      showChromosomeLabels: true,
      showBandLabels: true,
      orientation: 'vertical',
      perspective: 'comparative',
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });

  it('should have 1 syntenic region between human and mouse chromosomes', done => {
    // Tests use case from ../examples/vanilla/homology-interspecies.html

    function callback() {
      // See HomoloGene entry for MTOR at
      // http://www.ncbi.nlm.nih.gov/homologene/3637
      // Placements for H. sapiens and M. musculus used below.
      // Placements from latest annotation release in
      // Human: http://www.ncbi.nlm.nih.gov/gene/2475#genomic-context
      // Mouse: http://www.ncbi.nlm.nih.gov/gene/56717#genomic-context

      var chrs = ideogram.chromosomes,
        humanTaxid = ideogram.getTaxid('human'),
        mouseTaxid = ideogram.getTaxid('mouse'),
        chr1 = chrs[humanTaxid]['1'],
        chr4 = chrs[mouseTaxid]['4'],
        syntenicRegions = [],
        range1, range2;

      range1 = {
        chr: chr1,
        start: 11106531,
        stop: 11262557,
        orientation: 'reverse'
      };

      range2 = {
        chr: chr4,
        start: 148448582,
        stop: 148557685
      };

      syntenicRegions.push({r1: range1, r2: range2});

      ideogram.drawSynteny(syntenicRegions);

      var numHumanChromosomes = Object.keys(ideogram.chromosomes['9606']).length;
      assert.equal(numHumanChromosomes, 1, 'numHumanChromosomes');

      var numMouseChromosomes = Object.keys(ideogram.chromosomes['10090']).length;
      assert.equal(numMouseChromosomes, 1, 'numMouseChromosomes');

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      // console.log(d3.selectAll('.syntenicRegion'));

      assert.equal(numSyntenicRegions, 1, 'numSyntenicRegions');

      // Test related convenience methods
      humanCommonName = ideogram.getCommonName('9606');
      mouseCommonName = ideogram.getCommonName('10090');
      humanScientificName = ideogram.getScientificName('9606');
      mouseScientificName = ideogram.getScientificName('10090');
      assert.equal(humanCommonName, 'Human');
      assert.equal(mouseCommonName, 'Mouse');
      assert.equal(humanScientificName, 'Homo sapiens');
      assert.equal(mouseScientificName, 'Mus musculus');

      done();
    }

    config.organism = ['human', 'mouse'];
    config.chromosomes = {
      human: ['1'],
      mouse: ['4']
    };
    config.orientation = 'vertical';
    config.perspective = 'comparative';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 1 syntenic region between human and chimpanzee chromosomes', done => {
    // Tests support for drawing features between a fully-banded genome and a
    // genome that only has centromere data, as is possible in "Orthologs"
    // example

    function callback() {

      var chrs = ideogram.chromosomes,
        humanTaxid = ideogram.getTaxid('human'),
        chimpanzeeTaxid = ideogram.getTaxid('chimpanzee'),
        chr1 = chrs[humanTaxid]['1'],
        chr4 = chrs[chimpanzeeTaxid]['4'],
        syntenicRegions = [],
        range1, range2;

      range1 = {
        chr: chr1, start: 11106531, stop: 11262557, orientation: 'reverse'
      };

      range2 = {
        chr: chr4, start: 148448582, stop: 148557685
      };

      syntenicRegions.push({r1: range1, r2: range2});

      ideogram.drawSynteny(syntenicRegions);

      var numHumanChromosomes = Object.keys(ideogram.chromosomes['9606']).length;
      assert.equal(numHumanChromosomes, 1);

      var numChimpanzeeChromosomes = Object.keys(ideogram.chromosomes['9598']).length;
      assert.equal(numChimpanzeeChromosomes, 1);

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      // console.log(d3.selectAll('.syntenicRegion'));

      assert.equal(numSyntenicRegions, 1);

      done();
    }

    config.organism = ['human', 'chimpanzee'];
    config.chromosomes = {
      human: ['1'],
      chimpanzee: ['4']
    };
    config.orientation = 'vertical';
    config.perspective = 'comparative';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should have 1 syntenic region between a chimpanzee and gorilla chromosome', done => {
    // Tests support for drawing two genomes that have centromere data,
    // as is possible in "Orthologs" example

    function callback() {

      var chrs = ideogram.chromosomes,
        chimpanzeeTaxid = ideogram.getTaxid('chimpanzee'),
        gorillaTaxid = ideogram.getTaxid('gorilla'),
        chr1 = chrs[chimpanzeeTaxid]['1'],
        chr4 = chrs[gorillaTaxid]['4'],
        syntenicRegions = [],
        range1, range2;

      range1 = {
        chr: chr1, start: 11106531, stop: 11262557, orientation: 'reverse'
      };

      range2 = {
        chr: chr4, start: 148448582, stop: 148557685
      };

      syntenicRegions.push({r1: range1, r2: range2});

      ideogram.drawSynteny(syntenicRegions);

      var numChimpanzeeChromosomes = Object.keys(ideogram.chromosomes[chimpanzeeTaxid]).length;
      assert.equal(numChimpanzeeChromosomes, 1);

      var numGorillaChromosomes = Object.keys(ideogram.chromosomes[gorillaTaxid]).length;
      assert.equal(numGorillaChromosomes, 1);

      var numSyntenicRegions = document.getElementsByClassName('syntenicRegion').length;
      // console.log(d3.selectAll('.syntenicRegion'));

      assert.equal(numSyntenicRegions, 1);

      done();
    }

    config.organism = ['chimpanzee', 'gorilla'];
    config.chromosomes = {
      chimpanzee: ['1'],
      gorilla: ['4']
    };
    config.orientation = 'vertical';
    config.perspective = 'comparative';

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it('should show 3 syntenic regions in collinear vertical genomes', done => {
    // Tests use case from ../examples/vanilla/compare-whole-genomes
    // Used for comparing multiple whole genomes

    function onIdeogramLoad() {
      var chrs, chr1, chr4, humanTaxid, mouseTaxid;

      humanTaxid = ideogram.getTaxid('human');
      mouseTaxid = ideogram.getTaxid('mouse');

      chrs = ideogram.chromosomes;
      chr1 = chrs[humanTaxid]['1'];
      chr4 = chrs[mouseTaxid]['4'];
      chr19 = chrs[mouseTaxid]['19'];
      syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: 11106531,
        stop: 11262557,
        orientation: 'reverse'
      };

      range2 = {
        chr: chr4,
        start: 148448582,
        stop: 148557685
      };
      // range2 = {
      //   chr: chr19,
      //   start: 61431564,
      //   stop: 61431565 // end of mouse chr19
      // };

      syntenicRegions.push({r1: range1, r2: range2});

      var chr10 = chrs[humanTaxid]['10'];
      var range3 = {
        chr: chr10,
        start: 87864470,
        stop: 87965472
      };
      var range4 = {
        chr: chr19,
        start: 32758445,
        stop: 32820028
      };
      syntenicRegions.push({r1: range3, r2: range4});

      var range5 = {
        chr: chr10,
        start: 26216810,
        stop: 26300961
      };
      var range6 = {
        chr: chrs[mouseTaxid]['2'],
        start: 22622663,
        stop: 22690346
      };
      syntenicRegions.push({r1: range5, r2: range6});

      ideogram.drawSynteny(syntenicRegions);

      var selector1, selector3, line1, line3;

      selector1 = '#chr1-9606_11106531_11262557___chr4-10090_148448582_148557685';
      selector3 = '#chr10-9606_26216810_26300961___chr2-10090_22622663_22690346';

      line1 = document.querySelector(selector1 + ' .syntenyBorder');
      line3 = document.querySelector(selector3 + ' .syntenyBorder');

      assert.equal(Math.round(line1.getAttribute('x1')), 56);
      assert.equal(Math.round(line1.getAttribute('x2')), 250);
      assert.equal(Math.round(line1.getAttribute('y1')), 24);

      assert.equal(Math.round(line3.getAttribute('y1')), 322);
      assert.equal(Math.round(line3.getAttribute('y2')), 60);
      done();
    }

    config = {
      organism: ['human', 'mouse'],
      orientation: 'vertical',
      geometry: 'collinear',
      chromosomeScale: 'absolute',
      chrHeight: 40,
      chrMargin: 3,
      dataDir: '/dist/data/bands/native/',
      onLoad: onIdeogramLoad
    };

    ideogram = new Ideogram(config);
  });

  it('should show 3 syntenic regions in collinear horizontal genomes', done => {
    // Tests use case from ../examples/vanilla/compare-whole-genomes
    // Used for comparing multiple whole genomes

    function onIdeogramLoad() {
      var chrs, chr1, chr4, humanTaxid, mouseTaxid;

      humanTaxid = ideogram.getTaxid('human');
      mouseTaxid = ideogram.getTaxid('mouse');

      chrs = ideogram.chromosomes;
      chr1 = chrs[humanTaxid]['1'];
      chr4 = chrs[mouseTaxid]['4'];
      chr19 = chrs[mouseTaxid]['19'];
      syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: 11106531,
        stop: 11262557,
        orientation: 'reverse'
      };

      range2 = {
        chr: chr4,
        start: 148448582,
        stop: 148557685
      };
      // range2 = {
      //   chr: chr19,
      //   start: 61431564,
      //   stop: 61431565 // end of mouse chr19
      // };

      syntenicRegions.push({r1: range1, r2: range2});

      var chr10 = chrs[humanTaxid]['10'];
      var range3 = {
        chr: chr10,
        start: 87864470,
        stop: 87965472
      };
      var range4 = {
        chr: chr19,
        start: 32758445,
        stop: 32820028
      };
      syntenicRegions.push({r1: range3, r2: range4});

      var range5 = {
        chr: chr10,
        start: 26216810,
        stop: 26300961
      };
      var range6 = {
        chr: chrs[mouseTaxid]['2'],
        start: 22622663,
        stop: 22690346
      };
      syntenicRegions.push({r1: range5, r2: range6});

      ideogram.drawSynteny(syntenicRegions);

      var selector1, selector3, line1, line3;

      selector1 = '#chr1-9606_11106531_11262557___chr4-10090_148448582_148557685';
      selector3 = '#chr10-9606_26216810_26300961___chr2-10090_22622663_22690346';

      line1 = document.querySelector(selector1 + ' .syntenyBorder');
      line3 = document.querySelector(selector3 + ' .syntenyBorder');

      assert.equal(Math.round(line1.getAttribute('x1')), 7);
      assert.equal(Math.round(line1.getAttribute('x2')), 124);
      assert.equal(Math.round(line1.getAttribute('y1')), 41);
      assert.equal(Math.round(line1.getAttribute('y2')), 201);

      assert.equal(Math.round(line3.getAttribute('x1')), 305);
      assert.equal(Math.round(line3.getAttribute('x2')), 43);

      done();
    }

    config = {
      organism: ['human', 'mouse'],
      orientation: 'horizontal',
      geometry: 'collinear',
      chromosomeScale: 'absolute',
      chrHeight: 40,
      chrMargin: 3,
      dataDir: '/dist/data/bands/native/',
      onLoad: onIdeogramLoad
    };

    ideogram = new Ideogram(config);
  });

  it('should plot accurate synteny in relative collinear vertical genomes', done => {
    // Tests use case from ../examples/vanilla/compare-whole-genomes
    // Used for comparing multiple whole genomes

    function onIdeogramLoad() {
      var chrs, chr1, chrI, taxid1, taxid2, syntenicRegions,
        range1, range2, range2End;

      taxid1 = ideogram.getTaxid('homo-sapiens');
      taxid2 = ideogram.getTaxid('caenorhabditis-elegans');

      chrs = ideogram.chromosomes;
      chr1 = chrs[taxid1]['1'];
      chrI = chrs[taxid2]['I']; // eslint-disable-line dot-notation
      syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: 1,
        stop: 1
      };

      range2 = {
        chr: chrI,
        start: 1,
        stop: 1
      };

      range2End = {
        chr: chrI,
        start: 15072434,
        stop: 15072434
      };

      syntenicRegions.push({r1: range1, r2: range2});
      syntenicRegions.push({r1: range1, r2: range2End});

      ideogram.drawSynteny(syntenicRegions);

      line1 = document.querySelectorAll('.syntenyBorder')[0];
      line2 = document.querySelectorAll('.syntenyBorder')[3];

      assert.equal(Math.round(line1.getAttribute('x1')), 56);
      assert.equal(Math.round(line1.getAttribute('x2')), 250);
      assert.equal(Math.round(line1.getAttribute('y2')), 22);
      assert.equal(Math.round(line2.getAttribute('y2')), 58);

      done();

    }

    var config = {
      organism: ['homo-sapiens', 'caenorhabditis-elegans'],
      chrHeight: 50,
      chrMargin: 5,
      perspective: 'comparative',
      chromosomeScale: 'relative',
      geometry: 'collinear',
      dataDir: '/dist/data/bands/native/',
      onLoad: onIdeogramLoad
    };

    var ideogram = new Ideogram(config);
  });

});
