
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
      dataDir: 'https://raw.githubusercontent.com/eweitz/ideogram/05849a37242695d0d3dfb52059c4d0230842cda8/data/bands/native/',
      onLoad: callback
    });
  });

});
