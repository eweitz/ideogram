describe('Ideogram should', function() {

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

  it('hide gear by default, and show gear on ideogram hover', done => {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      const gear = document.getElementById('gear');

      // Gear should be hidden by default
      assert.equal(gear.style.display, 'none');

      // Gear should be hidden by default
      assert.equal(gear.style.display, 'none');

      done();
    }

    config.showTools = true;
    config.onLoad = callback;
    ideogram = new Ideogram(config);
  });

  it('show tools on gear click, and hide tools on outside click', done => {
    // Tests use case from ../examples/vanilla/human.html

    function callback() {
      // Hover over ideogram, then click gear
      d3.select('_ideogram').dispatch('mouseover');
      const gear = document.getElementById('gear');
      gear.click();

      // Tools should be shown on gear click
      const tools = document.getElementById('tools');
      assert.equal(tools.style.display, '');

      // Tools should hide on clicking outside the tools UI
      document.getElementById('_ideogramOuterWrap').click();

      assert.equal(tools.style.display, 'none');

      done();
    }

    config.showTools = true;
    config.onLoad = callback;
    ideogram = new Ideogram(config);
  });
});
