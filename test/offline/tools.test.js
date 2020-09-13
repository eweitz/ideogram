describe('Ideogram should', function() {

  var config = {};

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();

    config = {
      organism: 'human',
      showTools: true,
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

    config.onLoad = callback;
    ideogram = new Ideogram(config);
  });

  it('download image upon clicking "Download" -> "Image"', done => {

    function callback() {
      // Hover over ideogram, then click gear
      d3.select('_ideogram').dispatch('mouseover');
      const gear = document.getElementById('gear');
      gear.click();

      // Hover over "Download", then click "Image" in inner panel
      const downloadTool = document.getElementById('download-tool');
      const mouseenterEvent = new Event('mouseenter');
      downloadTool.dispatchEvent(mouseenterEvent);
      const downloadImageItem = document.getElementById('download-image');
      downloadImageItem.click();

      // Tick clock infinitesimally (1 ms), to account for trivial async
      setTimeout(function() {
        const selector = '#_ideogram-undisplayed-download-link';
        const downloadedDataUrl = document.querySelector(selector).href.length;

        // Ensure the download link has a non-empty data URL
        // Implementation details are in downloadPng() in `lib.js`.
        assert.equal(downloadedDataUrl > 100 === true);
      }, 1);

      done();
    }

    config.onLoad = callback;
    ideogram = new Ideogram(config);
  });
});
