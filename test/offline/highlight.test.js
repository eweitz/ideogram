describe('Ideogram', function() {

  var config = {};

  d3 = Ideogram.d3;

  beforeEach(function() {

    delete window.chrBands;
    d3.selectAll('div').remove();

    config = {
      organism: 'human',
      showNonNuclearChromosomes: true,
      dataDir: '/dist/data/bands/native/'
    };
  });

  it('should support highlighting and unhighlighting chromosomes', done => {

    function onIdeogramLoad() {
      // Verify highlight
      ideogram.highlight(['1', 'MT']);
      const highlights = document.querySelectorAll('.ideo-highlight');
      assert.equal(highlights.length, 2);
      assert.equal(highlights[1].id, 'ideo-highlight-chrMT-9606');

      // Verify unhighlight
      ideogram.unhighlight();
      const highlightsAfter = document.querySelectorAll('.ideo-highlight');
      assert.equal(highlightsAfter.length, 0);

      done();
    }

    config.onLoad = onIdeogramLoad;
    var ideogram = new Ideogram(config);
  });

});
