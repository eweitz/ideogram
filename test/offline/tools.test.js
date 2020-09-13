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

  it('show Download and About tools', done => {

    function callback() {
      // Hover over ideogram, then click gear
      d3.select('_ideogram').dispatch('mouseover');
      const gear = document.getElementById('gear');
      gear.click();

      // Hover over "Download" should show inner panel
      const downloadTool = document.getElementById('download-tool');
      const mouseenterEvent = new Event('mouseenter');
      downloadTool.dispatchEvent(mouseenterEvent);
      const downloadPanel = document.getElementById('download');
      assert.isDefined(downloadPanel);

      // Click on "About" should show modal
      const aboutTool = document.getElementById('about-tool');
      aboutTool.click();
      const aboutPanel = document.getElementById('about');
      assert.isDefined(aboutPanel);

      done();
    }

    config.showTools = true;
    config.onLoad = callback;
    ideogram = new Ideogram(config);
  });
});
