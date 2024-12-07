/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code
describe('Ideogram toggling', function() {
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
  it('should have properly scaled annotations after rotating', done => {
    // Tests use case from ../examples/vanilla/annotations-tracks.html
    function callback() {
      var annot, annotBox;
      annot = document.getElementsByClassName('annot')[3];
      annotBox = annot.getBoundingClientRect();
      try {
        assert.isBelow(Math.abs(annotBox.x - 101), 2);
        assert.isBelow(Math.abs(annotBox.y - 65), 2);
        assert.isBelow(Math.abs(annotBox.height - 14), 2);
        assert.isBelow(Math.abs(annotBox.right - 115), 2);
        assert.isBelow(Math.abs(annotBox.bottom - 79), 2);
        assert.isBelow(Math.abs(annotBox.left - 101), 2);
      } catch (e) {
        console.log('annotBox.x', annotBox.x)
        console.log('annotBox.y', annotBox.y)
        console.log('annotBox.height', annotBox.height)
        console.log('annotBox.right', annotBox.right)
        console.log('annotBox.bottom', annotBox.bottom)
        console.log('annotBox.left', annotBox.left)
        assert.isBelow(Math.abs(annotBox.x - 71), 2);
        assert.isBelow(Math.abs(annotBox.y - 65), 2);
        assert.isBelow(Math.abs(annotBox.height - 14), 2);
        assert.isBelow(Math.abs(annotBox.right - 85), 2);
        assert.isBelow(Math.abs(annotBox.bottom - 79), 2);
        assert.isBelow(Math.abs(annotBox.left - 71), 2);
      }
      done();
    }
    // Click chromosome 1 after it's loaded and had time to draw annotations.
    function loadCallback() {
      setTimeout(function() {
        d3.select('#chr1-9606-chromosome-set').dispatch('click');
      }, 500);
    }
    var annotationTracks = [
      {id: 'pathogenicTrack', displayName: 'Pathogenic', color: '#F00'},
      {id: 'uncertainSignificanceTrack', displayName: 'Uncertain significance', color: '#CCC'},
      {id: 'benignTrack', displayName: 'Benign', color: '#8D4'}
    ];
    var legend = [{
      name: 'Clinical significance (simulated)',
      rows: [
        {name: 'Pathogenic', color: '#F00', shape: 'triangle'},
        {name: 'Uncertain significance', color: '#CCC', shape: 'triangle'},
        {name: 'Benign', color: '#8D4', shape: 'triangle'}
      ]
    }];
    var config = {
      organism: 'human',
      chrWidth: 8,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/1000_virtual_snvs.json',
      annotationTracks: annotationTracks,
      annotHeight: 3.5,
      legend: legend,
      dataDir: '/dist/data/bands/native/',
      onLoad: loadCallback,
      onDidRotate: callback
    };
    ideogram = new Ideogram(config);
  });
  it('should handle toggling single- and multi-chromosome view, in vertical orientation', done => {
    function callback() {
      d3.select('#chr1-9606-chromosome-set').dispatch('click');
      var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
        return d.style.display !== 'none';
      });
      var shownChrID = shownChrs[0].id;
      assert.equal(shownChrs.length, 1);
      assert.equal(shownChrID, 'chr1-9606');
      d3.select('#chr1-9606-chromosome-set').dispatch('click');
      setTimeout(function() {
        var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
          return d.style.display !== 'none';
        });
        assert.equal(shownChrs.length, 24);
        done();
      }, 500);
    }
    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });
  it('should handle toggling single- and multi-chromosome view, in horizontal orientation', done => {
    function callback() {
      d3.select('#chr1-9606-chromosome-set').dispatch('click');
      var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
        return d.style.display !== 'none';
      });
      var shownChrID = shownChrs[0].id;
      assert.equal(shownChrs.length, 1);
      assert.equal(shownChrID, 'chr1-9606');
      d3.select('#chr1-9606-chromosome-set').dispatch('click');
      setTimeout(function() {
        var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
          return d.style.display !== 'none';
        });
        assert.equal(shownChrs.length, 24);
        done();
      }, 500);
    }
    config.onLoad = callback;
    config.orientation = 'horizontal';
    var ideogram = new Ideogram(config);
  });
  it('should handle toggling single- and multi-chromosome view, in labeled vertical orientation', done => {
    // Tests that band labels remain visible after rotating vertical chromosomes
    function callback() {
      d3.select('#chr1-9606-chromosome-set').dispatch('click');
      var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
        return d.style.display !== 'none';
      });
      var shownChrID = shownChrs[0].id;
      assert.equal(shownChrs.length, 1);
      assert.equal(shownChrID, 'chr1-9606');
      d3.select('#chr1-9606-chromosome-set').dispatch('click');
      setTimeout(function() {
        var shownChrs = d3.selectAll('.chromosome').nodes().filter(function(d) {
          return d.style.display !== 'none';
        });
        assert.equal(shownChrs.length, 24);
        var band = d3.select('.bandLabel.bsbsl-0');
        var bandRect = band.nodes()[0].getBoundingClientRect();
        assert.isBelow(Math.abs(bandRect.x - 13), 2);
        assert.isBelow(Math.abs(bandRect.y), 3);
        done();
      }, 500);
    }
    var config = {
      organism: 'human',
      showBandLabels: true,
      dataDir: '/dist/data/bands/native/',
      onLoad: callback
    };
    var ideogram = new Ideogram(config);
  });
});
