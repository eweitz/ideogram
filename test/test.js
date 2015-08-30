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

  it("should have 24 chromosomes for a human ideogram instance ", function() {

    // TODO:  Refactor to native JS promise
    function callback() {
      console.log("ideogram:");
      console.log(ideogram);

      console.log('ideogram.chromosomes');
      console.log(ideogram.chromosomes);
      console.log('ideogram.chromosomes["9606"]');
      console.log(ideogram.chromosomes["9606"]);

      var numChromosomes = Object.keys(ideogram.chromosomes["9606"]).length;
      assert.equal(numChromsomes, 24);
    }

    config.onLoad = callback;

    var ideogram = new Ideogram(config);


  });

});
