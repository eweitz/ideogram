// Most of these tests use Mocha's async support.
// Helpful:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe("Ideogram", function() {

  var config = {};

  beforeEach(function() {

    delete chrBands;
    d3.selectAll("svg").remove();

    config = {
      organism: "human",
      resolution: 550,
      chrWidth: 10,
      chrHeight: 150,
      chrMargin: 10,
      showChromosomeLabels: true,
      orientation: "vertical"
    };
  });

  function takeScreenshot() {
    if (window.callPhantom) {
      var date = new Date()
      var filename = "screenshots/" + date.getTime()
      console.log("Taking screenshot " + filename)
      callPhantom({'screenshot': filename})
    }
  }

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      takeScreenshot()
    }
  })

  it("should have a non-body container when specified", function() {
    config.container = ".small-ideogram";
    var ideogram = new Ideogram(config);
    assert.equal(ideogram.config.container, ".small-ideogram");
  });

  it("should write 'svg' element to DOM", function(done) {

    function callback() {
      var svg = document.getElementsByTagName("svg").length;
      assert.equal(svg, 1);
      done();
    }
    config.onLoad = callback;

    var ideogram = new Ideogram(config);
    // var svg = document.getElementsByTagName("svg").length;
    // assert.equal(svg, 1);
  });


  it("should have 24 chromosomes for a human ideogram instance", function(done) {
    // Tests use case from ../examples/human.html

    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes["9606"]).length;
      assert.equal(numChromosomes, 24);
      done();
    }

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });


  it("should have 21 chromosomes for a mouse ideogram instance", function(done) {
    // Tests use case from ../examples/mouse.html

    function callback() {
      var numChromosomes = Object.keys(ideogram.chromosomes["10090"]).length;
      assert.equal(numChromosomes, 21);
      done();
    }

    // Clears default setting from beforeEach (test artifact)
    delete config.organism;

    config.taxid = 10090;
    config.orientation = "horizontal";
    config.chromosomes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "X", "Y"];

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it("should have 4 syntenic regions for basic homology example", function(done) {
    // Tests use case from ../examples/homology_basic.html

    function callback() {

      var chrs = ideogram.chromosomes,
        chr1 = chrs["9606"]["1"],
        chr2 = chrs["9606"]["2"],
        r1Band, r2Band,
        r3Band, r4Band,
        r5Band, r6Band,
        range1, range2, range3, range4, range5, range6,
        syntenicRegions = [];

      r1Band = chr1.bands[2];
      range1 = {
        chr: chr1,
        start: r1Band.bp.start,
        stop: r1Band.bp.stop
      };

      r2Band = chr2.bands[2];
      range2 = {
        chr: chr2,
        start: r2Band.bp.start,
        stop: r2Band.bp.stop
      };

      // 1p11, chromosome 1 centromeric p band
      r3Band = chr1.bands[22];
      range3 = {
        chr: chr1,
        start: r3Band.bp.start,
        stop: r3Band.bp.stop
      };

      // 2p11.1, chromosome 2 centromeric p band
      r4Band = chr2.bands[13];
      range4 = {
        chr: chr2,
        start: r4Band.bp.start,
        stop: r4Band.bp.stop
      };

      // 1q12
      r5Band = chr1.bands[24]
      range5 = {
        chr: chr1,
        start: r5Band.bp.start,
        stop: r5Band.bp.stop
      };

      // 2q22
      r6Band = chr2.bands[24];
      range6 = {
        chr: chr2,
        start: r6Band.bp.start,
        stop: r6Band.bp.stop
      };

      // 1q24
      r7Band = chr1.bands[29]
      range7 = {
        chr: chr1,
        start: r7Band.bp.start,
        stop: r7Band.bp.stop
      };

      // 2q31 - 2q33
      range8 = {
        chr: chr2,
        start: chr2.bands[29].bp.start,
        stop: chr2.bands[33].bp.stop
      };

      syntenicRegions.push(
        {"r1": range1, "r2": range2},
        {"r1": range3, "r2": range4},
        {"r1": range5, "r2": range6},
        {"r1": range7, "r2": range8}
      );

      ideogram.drawSynteny(syntenicRegions);

      var numChromosomes = Object.keys(ideogram.chromosomes["9606"]).length;
      assert.equal(numChromosomes, 2);

      var numSyntenicRegions = document.getElementsByClassName("syntenicRegion").length;
      assert.equal(numSyntenicRegions, 4);

      done();
    }

    config.chromosomes = ["1", "2"];
    config.showBandLabels = true;
    config.orientation = "vertical";
    config.perspective = "comparative";

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });


  it("should have 25 syntenic regions for advanced example", function(done) {
    // Tests use case from ../examples/homology_advanced.html

    function callback() {

      var chrs = ideogram.chromosomes,
        chr1 = chrs["10090"]["1"],
        chr2 = chrs["10090"]["2"],
        r1Band = chr1["bands"][7],
        r2Band = chr2["bands"][17],
        range1, range2, range3, range4, range5, range6,
        syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: r1Band.bp.start,
        stop: r1Band.bp.stop
      };

      for (var i = 1; i < 20; i++) {
        range2 = {
          chr: chr2,
          start: 6000000 * i,
          stop: 6500000 * i
        };
        syntenicRegions.push({"r1": range1, "r2": range2, "color": "#F55"});
      }

      var range3 = {
        chr: chr1,
        start: 125000000,
        stop: 126000000
      };

      range4 = {
        chr: chr2,
        start: 1500000 * i,
        stop: 3600000 * i
      };
      syntenicRegions.push({"r1": range3, "r2": range4, "opacity": 0.7});

      var range5 = {
        chr: chr2,
        start: r2Band.bp.start,
        stop: r2Band.bp.stop
      };

      for (var i = 1; i < 6; i++) {
        range6 = {
          chr: chr1,
          start: 120000000 + (12000000 * i),
          stop: 120000000 + (8000000 * i)
        };
        color = "#AAF";
        if (i == 5) {
          color = "#DDD";
        }
        syntenicRegions.push({"r1": range5, "r2": range6, "color": color});
      }

      ideogram.drawSynteny(syntenicRegions);

      var numChromosomes = Object.keys(ideogram.chromosomes["10090"]).length;
      assert.equal(numChromosomes, 2);

      var numSyntenicRegions = document.getElementsByClassName("syntenicRegion").length;
      assert.equal(numSyntenicRegions, 25);

      done();
    }

    config = {
      taxid: 10090,
      chromosomes: ["1", "2"],
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 200,
      showChromosomeLabels: true,
      showBandLabels: true,
      orientation: "vertical",
      perspective: "comparative",
      onLoad: callback
    };

    var ideogram = new Ideogram(config);
  });


  it("should have 1 syntenic region between a human and a mouse chromosome", function(done) {
    // Tests use case from ../examples/homology_interspecies.html

    function callback() {
      // See HomoloGene entry for MTOR at
      // http://www.ncbi.nlm.nih.gov/homologene/3637
      // Placements for H. sapiens and M. musculus used below.
      // Placements from latest annotation release in
      // Human: http://www.ncbi.nlm.nih.gov/gene/2475#genomic-context
      // Mouse: http://www.ncbi.nlm.nih.gov/gene/56717#genomic-context

      var chrs = ideogram.chromosomes,
        chr1 = chrs["9606"]["1"],
        chr4 = chrs["10090"]["4"],
        syntenicRegions = [];

      range1 = {
        chr: chr1,
        start: 11106531,
        stop: 11262557,
        orientation: "reverse"
      };

      range2 = {
        chr: chr4,
        start: 148448582,
        stop: 148557685
      };

      syntenicRegions.push({"r1": range1, "r2": range2});

      ideogram.drawSynteny(syntenicRegions);

      var numHumanChromosomes = Object.keys(ideogram.chromosomes["9606"]).length;
      assert.equal(numHumanChromosomes, 1, "numHumanChromosomes");

      var numMouseChromosomes = Object.keys(ideogram.chromosomes["10090"]).length;
      assert.equal(numMouseChromosomes, 1, "numMouseChromosomes");

      var numSyntenicRegions = document.getElementsByClassName("syntenicRegion").length;
      //console.log(d3.selectAll(".syntenicRegion"));

      console.log('document.getElementsByClassName("syntenicRegion")');
      console.log(document.getElementsByClassName("syntenicRegion")[0][0]);

      assert.equal(numSyntenicRegions, 1, "numSyntenicRegions");

      done();
    }

    config.organism = ["human", "mouse"];
    config.chromosomes = {
      "human": ["1"],
      "mouse": ["4"]
    };
    config.orientation = "vertical";
    config.perspective = "comparative";

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

  it("should have 1000 annotations in basic annotations example", function(done) {
    // Tests use case from ../examples/annotations_basic.html

    function callback() {
      var numAnnots = document.getElementsByClassName("annot").length;
      assert.equal(numAnnots, 1000);
      done();
    }

    config.annotationsPath = "../data/annotations/1000_virtual_snvs.json";

    config.onDrawAnnots = callback;
    var ideogram = new Ideogram(config);
  });


  it("should have 1000 annotations in overlaid annotations example", function(done) {
    // Tests use case from ../examples/annotations_overlaid.html

    function callback() {
      var numAnnots = document.getElementsByClassName("annot").length;
      assert.equal(numAnnots, 1000);
      done();
    }

    config = {
      organism: "human",
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 5,
      showChromosomeLabels: true,
      annotationsPath: "../data/annotations/1000_virtual_snvs.json",
      annotationsLayout: "overlay",
      orientation: "horizontal",
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it("should have 1000 annotations and 5 tracks in tracks annotations example", function(done) {
    // Tests use case from ../examples/annotations_tracks.html
    // TODO: Add class to annots indicating track

    function callback() {
      var numAnnots = document.getElementsByClassName("annot").length;
      assert.equal(numAnnots, 1000);
      done();
    }

    var annotationTracks = [
      {"id": "pathogenicTrack", "displayName": "Pathogenic", "color": "#F00"},
      {"id": "likelyPathogenicTrack", "displayName": "Likely pathogenic", "color": "#DB9"},
      {"id": "uncertainSignificanceTrack", "displayName": "Uncertain significance", "color": "#CCC"},
      {"id": "likelyBenignTrack", "displayName": "Likely benign", "color": "#BD9"},
      {"id": "benignTrack",  "displayName": "Benign", "color": "#8D4"}
    ]

    var config = {
      taxid: 9606,
      chrWidth: 8,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: "../data/annotations/1000_virtual_snvs.json",
      annotationTracks: annotationTracks,
      annotationHeight: 2.5,
      orientation: "vertical",
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });

  it("should have 2015 annotations in histogram annotations example", function(done) {
    // Tests use case from ../examples/annotations_histogram.html
    // TODO: Add class to annots indicating track

    function callback() {
      var numAnnots = document.getElementsByClassName("annot").length;
      assert.equal(numAnnots, 2015);
      done();
    }

    var config = {
      organism: "human",
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: "../data/annotations/all_human_genes.json",
      annotationsLayout: "histogram",
      barWidth: 3,
      orientation: "vertical",
      onDrawAnnots: callback
    };

    ideogram = new Ideogram(config);
  });


  it("should have histogram bars roughly flush with chromosome ends", function(done) {
    // Tests use case from ../examples/annotations_histogram.html
    // TODO: Add class to annots indicating track

    function getTerEnd(arm) {
      // Helper function to get the x coordinate of the outermost
      // edge of the p or q arm of chromosome 1
        var armIndex = (arm === 'p') ? 1 : 2,
          ter = d3.selectAll('.chromosome-border path:nth-child(' + armIndex + ')'),
          terBox = ter.nodes()[0].getBBox(),
          terX = terBox.x,
          terWidth = terBox.width,
          terEnd,
          inst = ter.attr('d').split(' '), // Path instructions in description ('d')
          terCurve = parseInt(inst[4].replace('Q', '').split(',')[0]),
          terCurveX = parseInt(inst[0].replace('M', '').split(',')[0]),
          terStroke = parseFloat(ter.style("stroke-width").slice(0, -2));

          if (arm === 'p') {
            terEnd = terCurve;
          } else {
            terEnd = terCurve + terCurveX - terStroke;
          }

          terEnd = terEnd.toFixed(2);

          return terEnd;
    }

    function onIdeogramLoadAnnots() {

      var pterEnd = getTerEnd("p"),
          firstAnnotEnd = d3.selectAll("#chr1-9606 .annot").nodes()[0].getBBox().x,
          qterEnd = getTerEnd("q"),
          tmp = d3.selectAll("#chr1-9606 .annot").nodes(),
          tmp = tmp[tmp.length - 1].getBBox(),
          bump = ideogram.bump,
          lastAnnotEnd = tmp.x + tmp.width;

          // console.log("pterEnd - firstAnnotEnd: " + (pterEnd - firstAnnotEnd));
          // console.log("qterEnd - lastAnnotEnd: " + (qterEnd - lastAnnotEnd));
          assert.isBelow(pterEnd - firstAnnotEnd - bump, 3);
          assert.isAbove(qterEnd - lastAnnotEnd - bump, -20);

      done();
    }

    var config = {
      organism: "human",
      chrWidth: 10,
      chrHeight: 500,
      chrMargin: 10,
      showChromosomeLabels: true,
      annotationsPath: "../data/annotations/all_human_genes.json",
      annotationsLayout: "histogram",
      barWidth: 3,
      orientation: "vertical",
      onDrawAnnots: onIdeogramLoadAnnots
    };

    ideogram = new Ideogram(config);
  });

  it("should have 12 chromosomes per row in small layout example", function(done) {
      // Tests use case from ../examples/layout_small.html

      function callback() {

        t1 = d3.select("#chr12-9606-chromosome-set").attr("transform");
        t2 = d3.select("#chr13-9606-chromosome-set").attr("transform");

        lastChrRow1Y = parseInt(t1.split('translate(')[1].split(',')[0], 10);
        firstChrRow2Y = parseInt(t2.split('translate(')[1].split(',')[0], 10);

        assert.isTrue(firstChrRow2Y > lastChrRow1Y + config.chrHeight);

        done();
      }

      document.getElementsByTagName("body")[0].innerHTML += '<div class="small-ideogram"></div>';

      var config = {
        container: ".small-ideogram",
        organism: "human",
        resolution: 550,
        chrWidth: 10,
        chrHeight: 150,
        chrMargin: 10,
        rows: 2,
        showChromosomeLabels: true,
        orientation: "vertical"
      };

      config.onLoad = callback;
      var ideogram = new Ideogram(config);
    });


    it("should use GRCh37 when specified in 'assembly' parameter", function(done) {
      // Tests use case from ../examples/human.html

      function callback() {
        var bands = ideogram.chromosomes["9606"]["1"]["bands"]
        var chr1Length = bands[bands.length - 1].bp.stop;
        assert.equal(chr1Length, 249250621);
        done();
      }

      config.assembly = "GRCh37";
      config.onLoad = callback;
      var ideogram = new Ideogram(config);
    });

    it("should handle arrayed objects in 'annotations' parameter", function(done) {
      // Tests use case from ../examples/human.html

      function callback() {
        var numAnnots = d3.selectAll(".annot").nodes().length;
        assert.equal(numAnnots, 1);
        done();
      }

      config.annotations = [{
        "name": "BRCA1",
        "chr": "17",
        "start": 43044294,
        "stop": 43125482
      }];
      config.onDrawAnnots = callback;
      var ideogram = new Ideogram(config);
    });


    it("should align chr. label with thick horizontal chromosome", function(done) {
      // Tests use case from ../examples/annotations_basic.html

      function callback() {
        var band, bandMiddle,
            chrLabel, chrLabelMiddle;

        band = d3.selectAll(".chromosome .band").nodes()[0].getBoundingClientRect();
        chrLabel = d3.selectAll(".chromosome-set-label").nodes()[0].getBoundingClientRect();

        bandMiddle = band.top + band.height/2;
        chrLabelMiddle = chrLabel.top + chrLabel.height/2;

        labelsDiff = Math.abs(bandMiddle - chrLabelMiddle);

        assert.isAtMost(labelsDiff, 1);
        done();
      }

      config = {
        organism: "human",
        chrHeight: 600,
        chrWidth: 20,
        orientation: "horizontal",
        chromosomes: ["17"],
        annotations: [{
          "name": "BRCA1",
          "chr": "17",
          "start": 43044294,
          "stop": 43125482
        }],
        annotationHeight: 6
      };
      config.onDrawAnnots = callback;
      var ideogram = new Ideogram(config);
    });

    it("should align chr. label with vertical chromosome", function(done) {
      // Tests use case from ../examples/human.html

      function callback() {
        var band, bandMiddle,
            chrLabel, chrLabelMiddle;

        band = d3.selectAll(".chromosome .band").nodes()[0].getBoundingClientRect();
        chrLabel = d3.selectAll(".chromosome-set-label").nodes()[0].getBoundingClientRect();

        bandMiddle = band.left + band.width/2;
        chrLabelMiddle = chrLabel.left + chrLabel.width/2;

        labelsDiff = Math.abs(bandMiddle - chrLabelMiddle);

        assert.isAtMost(labelsDiff, 1);
        done();
      }


      var annotationTracks = [
        {"id": "pathogenicTrack", "displayName": "Pathogenic", "color": "#F00"},
        {"id": "likelyPathogenicTrack", "displayName": "Likely pathogenic", "color": "#DB9"},
        {"id": "uncertainSignificanceTrack", "displayName": "Uncertain significance", "color": "#CCC"},
        {"id": "likelyBenignTrack", "displayName": "Likely benign", "color": "#BD9"},
        {"id": "benignTrack",  "displayName": "Benign", "color": "#8D4"}
      ]

      var config = {
        organism: "human",
        chrWidth: 20,
        chrHeight: 500,
        annotationsPath: "../data/annotations/1000_virtual_snvs.json",
        annotationTracks: annotationTracks,
        annotationHeight: 2.5
      };
      config.onDrawAnnots = callback;
      var ideogram = new Ideogram(config);
    });


    it("should align chr. label with band-labeled vertical chromosome", function(done) {
      // Tests use case from ../examples/human.html

      function callback() {

        var band, bandMiddle,
            chrLabel, chrLabelMiddle;

        band = d3.select(".chromosome .band").nodes()[0].getBoundingClientRect();
        chrLabel = d3.select(".chromosome .chrLabel").nodes()[0].getBoundingClientRect();

        bandMiddle = band.left + band.width/2;
        chrLabelMiddle = chrLabel.left + chrLabel.width/2;

        labelsDiff = Math.abs(bandMiddle - chrLabelMiddle);

        assert.isAtMost(labelsDiff, 1);
        done();
      }

      var config = {
        organism: "human",
        showBandLabels: true,
        chrHeight: 500
      };
      config.onLoad = callback;
      var ideogram = new Ideogram(config);
    });


});
