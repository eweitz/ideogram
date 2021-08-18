describe('Color support includes', function() {

  var config = {};

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();

    config = {
      organism: 'human',
      showFullyBanded: false,
      dataDir: '/dist/data/bands/native/'
    };
  });

  it('chrFillColor as string', done => {

    function callback() {
      const arm =
        document.querySelectorAll('.chromosome-border')[0].children[0];
      assert.equal(arm.getAttribute('fill'), 'green');
      done();
    }
    config.chrFillColor = 'green';
    config.onLoad = callback;
    const ideogram = new Ideogram(config);
  });

  it('chrFillColor as object', done => {

    function callback() {
      // Get last centromere
      const centromere =
        Array.from(document.querySelectorAll('.acen')).slice(-1)[0];
      assert.equal(centromere.style.fill, 'rgb(238, 238, 170)');
      done();
    }
    config.chrFillColor = {arm: '#AEA', centromere: '#EEA'};
    config.onLoad = callback;
    const ideogram = new Ideogram(config);
  });
});
