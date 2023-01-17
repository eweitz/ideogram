
/* eslint-disable no-new */

describe('Ideogram custom organism support', function() {

  // Account for latency in Ensembl, MyGene.info, and WikiPathways
  this.timeout(25000);

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('fetches chromosome data from remote URL', done => {
    // Tests use case from ../examples/vanilla/custom-organism

    function callback() {
      const numChrs = Object.keys(ideogram.chromosomes['-1']).length;
      assert.equal(numChrs, 13);
      done();
    }

    const ideogram = new Ideogram({
      organism: 'custom',
      dataDir: 'https://raw.githubusercontent.com/eweitz/ideogram/aff3866b022b55e76b8ad7d45ba216361019a186/data/bands/native/',
      onLoad: callback
    });
  });

  it('fetches chromosome data from remote URL lacking file extension', done => {
    // Tests use case from ../examples/vanilla/custom-organism

    function callback() {
      const numChrs = Object.keys(ideogram.chromosomes['-1']).length;
      assert.equal(numChrs, 13);
      done();
    }

    const ideogram = new Ideogram({
      organism: 'customjsonnoextension',
      dataDir: 'https://raw.githubusercontent.com/eweitz/ideogram/aff3866b022b55e76b8ad7d45ba216361019a186/data/bands/native/',
      onLoad: callback
    });
  });

  it('rotates chromosomes lacking native bands', done => {
    // Tests fix for https://github.com/eweitz/ideogram/issues/330

    function callback() {
      let chr1 = document.querySelector('#chr1-29760');
      const height = Math.round(chr1.getBoundingClientRect().height);
      assert.equal(height, 304);
      chr1.dispatchEvent(new Event('click', {bubbles: true}));
      setTimeout(function() {
        chr1 = document.querySelector('#chr1-29760');
        const width = Math.round(chr1.getBoundingClientRect().width);
        assert.equal(width, 545);
        chr1.dispatchEvent(new Event('click', {bubbles: true}));
        done();
      }, 1000);
    }

    const ideogram = new Ideogram({
      organism: 'vitis-vinifera',
      onLoad: callback
    });
  });

});
