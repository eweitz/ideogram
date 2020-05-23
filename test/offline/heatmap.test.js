/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram heatmap', function() {

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

  it('should have two heatmap tracks for each chromosome', done => {
    // Tests use case from ../examples/vanilla/annotations-heatmap.html

    function callback() {
      var numHeatmaps = document.querySelectorAll('canvas').length;
      var chr1HeatmapTrackTwo = document.querySelectorAll('canvas#chr1-9606-canvas-1').length;
      assert.equal(numHeatmaps, 48);
      assert.equal(chr1HeatmapTrackTwo, 1);
      done();
    }

    document.getElementsByTagName('body')[0].innerHTML +=
      '<div id="container"></div>';

    var annotationTracks = [
      {id: 'expressionLevelTrack', displayName: 'Expression level'},
      {id: 'geneTypeTrack', displayName: 'Gene type'}
    ];

    var config = {
      container: '#container',
      organism: 'human',
      assembly: 'GRCh37',
      chrHeight: 275,
      annotationsPath: '../dist/data/annotations/SRR562646.json',
      annotationsLayout: 'heatmap',
      heatmaps: [
        {
          key: 'expression-level',
          thresholds: [['0', '#AAA'], ['3', '#88F'], ['+', '#F33']]
        },
        {
          key: 'gene-type',
          thresholds: [['0', '#00F'], ['1', '#0AF'], ['2', '#AAA'], ['3', '#FA0'], ['4', '#F00']]
        }
      ],
      annotationTracks: annotationTracks,
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should show track label upon hovering over heatmap track', done => {
    // Tests use case from ../examples/vanilla/annotations-heatmap.html

    function callback() {
      d3.select('#chr1-9606-canvas-0').dispatch('mouseover');
      var trackLabel = d3.select('#_ideogramTrackLabel').html();
      assert.equal(trackLabel, 'expression-level<br>gene-type');
      done();
    }

    document.getElementsByTagName('body')[0].innerHTML +=
      '<div id="container"></div>';

    var annotationTracks = [
      {id: 'expressionLevelTrack', displayName: 'Expression level'},
      {id: 'geneTypeTrack', displayName: 'Gene type'}
    ];

    var config = {
      container: '#container',
      organism: 'human',
      assembly: 'GRCh37',
      chrHeight: 275,
      annotationsPath: '../dist/data/annotations/SRR562646.json',
      annotationsLayout: 'heatmap',
      heatmaps: [
        {
          key: 'expression-level',
          thresholds: [['0', '#AAA'], ['3', '#88F'], ['+', '#F33']]
        },
        {
          key: 'gene-type',
          thresholds: [['0', '#00F'], ['1', '#0AF'], ['2', '#AAA'], ['3', '#FA0'], ['4', '#F00']]
        }
      ],
      annotationTracks: annotationTracks,
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });
});
