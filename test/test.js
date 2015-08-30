// Most of these tests use Mocha's async support.
// Helpful:
//  - http://martinfowler.com/articles/asyncJS.html
//  - https://mochajs.org/#asynchronous-code

describe("Ideogram", function() {

  var config = {};

  beforeEach(function() {
    config = {
      taxid: 9606,
      chromosomes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"],
      resolution: 550,
      chrWidth: 10,
      chrHeight: 150,
      chrMargin: 10,
      showChromosomeLabels: true,
      orientation: "vertical"
    };
  });

  it("should have a non-body container when specified", function() {
    config.container = ".small-ideogram";
    var ideogram = new Ideogram(config);
    assert.equal(ideogram.config.container, ".small-ideogram");
  });

  it("should write 'svg' element to DOM", function() {
    var ideogram = new Ideogram(config);
    var svg = document.getElementsByTagName("svg").length;
    assert.equal(svg, 1);
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
      assert.equal(numChromosomes, 1);

      var numMouseChromosomes = Object.keys(ideogram.chromosomes["10090"]).length;
      assert.equal(numMouseChromosomes, 1);

      var numSyntenicRegions = document.getElementsByClassName("syntenicRegion").length;
      assert.equal(numSyntenicRegions, 1);

      done();
    }

    config.multiorganism = true;
    config.taxids = ["9606", "10090"];
    config.chromosomes: {
      "9606": ["1"],
      "10090": ["4"]
    };

    config.onLoad = callback;
    var ideogram = new Ideogram(config);
  });

});
