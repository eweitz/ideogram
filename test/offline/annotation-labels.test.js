describe('Ideogram annotation labels', function() {


  d3 = Ideogram.d3;

  beforeEach(function() {
    delete window.chrBands;
    d3.selectAll('div').remove();
  });

  it('supports annotation labels, pulse, and fade', done => {
    // Tests use case from ../examples/vanilla/related-genes.html
    //
    // This test is contrived and superficial, merely ensuring the feature
    // doesn't throw an error.

    function callback() {
      const ideo = this;
      ideo.addAnnotLabel('MTOR', '#fdd', '#f00');
      ideo.addAnnotLabel('BRCA1', '#feeefe', '#800080');

      ideo.fadeOutAnnotLabels();
      done();
    }

    var config = {
      organism: 'human',
      annotations: [
        {
          name: 'MTOR',
          chr: '1',
          start: 11106535,
          stop: 11262551
        },
        {
          name: 'BRCA1',
          chr: '17',
          start: 43044294,
          stop: 43125482
        }
      ],
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

});
