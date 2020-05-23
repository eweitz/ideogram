/* eslint-disable no-new */
/* eslint-disable spaced-comment */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

// For tests that use Mocha's async support, see:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe('Ideogram histogram', function() {

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

  it('should have 2015 annotations in histogram annotations example', done => {
    // Tests use case from ../examples/vanilla/annotations-histogram.html
    // TODO: Add class to annots indicating track

    function callback() {
      var numAnnots = document.getElementsByClassName('annot').length;
      assert.equal(numAnnots, 2015);
      done();
    }

    var config = {
      organism: 'human',
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/all_human_genes.json',
      annotationsLayout: 'histogram',
      barWidth: 3,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it('should have histogram bars roughly flush with chromosome ends', done => {
    // Tests use case from ../examples/vanilla/annotations-histogram.html
    // TODO: Add class to annots indicating track

    function getTerEnd(arm) {
      // Helper function to get the x coordinate of the outermost
      // edge of the p or q arm of chromosome 1
      var armIndex = (arm === 'p') ? 1 : 2,
        ter = d3.selectAll('.chromosome-border path:nth-child(' + armIndex + ')'),
        terEnd,
        inst = ter.attr('d').split(' '), // Path instructions in description ('d')
        terCurve = parseInt(inst[4].replace('Q', '').split(',')[0]),
        terCurveX = parseInt(inst[0].replace('M', '').split(',')[0]),
        terStroke = parseFloat(ter.style('stroke-width').slice(0, -2));

      if (arm === 'p') {
        terEnd = terCurve;
      } else {
        terEnd = terCurve + terCurveX - terStroke;
      }

      terEnd = terEnd.toFixed(2);

      return terEnd;
    }

    function onIdeogramLoadAnnots() {

      var pterEnd = getTerEnd('p'),
        firstAnnotEnd = d3.selectAll('#chr1-9606 .annot').nodes()[0].getBBox().x,
        qterEnd = getTerEnd('q'),
        pretmp = d3.selectAll('#chr1-9606 .annot').nodes(),
        tmp = pretmp[pretmp.length - 1].getBBox(),
        lastAnnotEnd = tmp.x + tmp.width;

      // console.log("pterEnd - firstAnnotEnd: " + (pterEnd - firstAnnotEnd));
      // console.log("qterEnd - lastAnnotEnd: " + (qterEnd - lastAnnotEnd));
      assert.isBelow(pterEnd - firstAnnotEnd, -1);
      assert.isAbove(qterEnd - lastAnnotEnd, -19);

      done();
    }

    var config = {
      organism: 'human',
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: '../dist/data/annotations/all_human_genes.json',
      annotationsLayout: 'histogram',
      barWidth: 3,
      orientation: 'vertical',
      dataDir: '/dist/data/bands/native/',
      onDrawAnnots: onIdeogramLoadAnnots
    };

    ideogram = new Ideogram(config);
  });
});
