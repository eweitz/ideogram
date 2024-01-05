
/* eslint-disable no-new */

// Tests use cases from ../examples/vanilla/related-genes

describe('Ideogram gene-tissue expression functionality', function() {

  // Account for latency
  this.timeout(10000);

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('shows mini curve, more curves, detailed curve', done => {
    async function callback() {
      await ideogram.plotRelatedGenes('APOE');
      setTimeout(async function() {
        const apoeLabel = document.querySelector('#ideogramLabel__c18_a1');
        apoeLabel.dispatchEvent(new Event('mouseover'));
        const curves = document.querySelectorAll('polyline');
        assert.equal(curves.length, 3);

        const moreLink = document.querySelector('._ideoMoreOrLessTissue');
        moreLink.dispatchEvent(new Event('click'));
        const moreCurves = document.querySelectorAll('polyline');
        assert.equal(moreCurves.length, 10);

        const adrenalSelector = 'rect[data-tissue="Adrenal_Gland"]';
        const adrenalCurve = document.querySelector(adrenalSelector);
        adrenalCurve.dispatchEvent(new Event('mouseenter'));
        const medianTick = document.querySelector('._ideoExpressionMedian');
        const tickColor = medianTick.getAttribute('stroke');
        assert.equal(tickColor, '#1c791c');

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
