/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram', function() {

  var config = {};

  d3 = Ideogram.d3;

  this.timeout(10000);

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

  it('should support collinear chromosome geometry', done => {

    function callback() {
      var chr2CanvasBox, chrLabel, labelX, labelY;

      chr2CanvasBox = d3.select('#chr2-9606-canvas-1').nodes()[0].getBoundingClientRect();

      chrLabel = document.querySelector('#chr6-9606-chromosome-set text');
      labelX = chrLabel.getAttribute('x');
      labelY = chrLabel.getAttribute('y');

      assert.equal(chr2CanvasBox.x, 111);

      assert.equal(labelX, '-8');
      assert.equal(labelY, '31');

      done();
    }

    var heatmaps = [
      {
        key: 'expression-level',
        thresholds: [
          ['2', '#88F'],
          ['4', '#CCC'],
          ['+', '#F33']]
      },
      {
        key: 'gene-type',
        thresholds: [
          ['0', '#00F'],
          ['1', '#0AF'],
          ['2', '#AAA'],
          ['3', '#FA0'],
          ['4', '#F00']
        ]
      }
    ];

    var annotationTracks = [
      {id: 'expressionLevelTrack', displayName: 'Expression level'},
      {id: 'geneTypeTrack', displayName: 'Gene type'}
    ];

    config = {
      organism: 'human',
      orientation: 'horizontal',
      geometry: 'collinear',
      chrHeight: 90,
      annotationHeight: 30,
      annotationsLayout: 'heatmap',
      dataDir: '/dist/data/bands/native/',
      annotationsPath: '/dist/data/annotations/oligodendroglioma_cnv_expression.json',
      heatmaps: heatmaps,
      annotationTracks: annotationTracks
    };

    config.onDrawAnnots = callback;
    var ideogram = new Ideogram(config);
  });

  it('should support demarcating collinear chromosome heatmaps', done => {

    function callback() {
      var style = d3.select('#_ideogramTrackLabelContainer > div').node().style;
      assert.equal(style.left, '13px');
      assert.equal(style.top, '2px');
      done();
    }

    var heatmapThresholds = [
      [0.7, '#33F'],
      [1.2, '#DDD'],
      ['+', '#F33']
    ];

    var legend = [{
      name: 'Expression level',
      rows: [
        {name: 'Low', color: '#33F'},
        {name: 'Normal', color: '#CCC'},
        {name: 'High', color: '#F33'}
      ]
    }];

    ideogram = new Ideogram({
      organism: 'human',
      orientation: 'horizontal',
      geometry: 'collinear',
      chrHeight: 80,
      showFullyBanded: false,
      // showChromosomeLabels: false,
      rotatable: false,
      legend: legend,
      annotationHeight: 30,
      annotationsLayout: 'heatmap',
      heatmapThresholds: heatmapThresholds,
      dataDir: '/dist/data/bands/native/',
      annotationsPath: '../dist/data/annotations/oligodendroglioma_cnv_expression.json',
      onDrawAnnots: callback
    });
  });

  // it('should support 2D heatmaps', done => {

  //   function callback() {
  //     var canvas = d3.select('#chr5-9606-canvas').node();
  //     assert.equal(canvas.width, 429);
  //     assert.equal(canvas.height, 480);
  //     done();
  //   }

  //   var legend = [{
  //     name: 'Expression level',
  //     rows: [
  //       {name: 'Low', color: '#33F'},
  //       {name: 'Normal', color: '#CCC'},
  //       {name: 'High', color: '#F33'}
  //     ]
  //   }];

  //   ideogram = new Ideogram({
  //     organism: 'human',
  //     orientation: 'vertical',
  //     chromosome: '5',
  //     chrHeight: 450,
  //     chrMargin: 10,
  //     showFullyBanded: false,
  //     showBandLabels: false,
  //     legend: legend,
  //     heatmapThresholds: [0, 0.13, 0.27, 0.4, 0.53, 0.67, 0.8, 0.93, 1.1, 1.2, 1.33, 1.47, 1.6, 1.73, 1.87, 2],
  //     annotationHeight: 3,
  //     annotationsLayout: 'heatmap-2d',
  //     dataDir: '/dist/data/bands/native/',
  //     annotationsPath: 'https://www.googleapis.com/storage/v1/b/ideogram/o/oligodendroglioma%2finfercnv.observations.optimized.txt?alt=media',
  //     onDrawAnnots: callback
  //   });
  // });

});
