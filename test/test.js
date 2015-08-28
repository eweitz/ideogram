describe("Ideogram", function() { 
  
  it("should have a container if specified", function() {

  var config = {
    container: ".small-ideogram",
    taxid: 9606,
    chromosomes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"],
    resolution: 550,
    chrWidth: 10,
    chrHeight: 150,
    chrMargin: 10,
    rows: 2,
    showChromosomeLabels: true,
    orientation: "vertical"
  };

  var ideogram = new Ideogram(config);

  assert.equal(ideogram.config.container, ".small-ideogram");

  });  

it("should have chromosome objects", function() {

  var config = {
    container: ".small-ideogram",
    taxid: 9606,
    chromosomes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"],
    resolution: 550,
    chrWidth: 10,
    chrHeight: 150,
    chrMargin: 10,
    rows: 2,
    showChromosomeLabels: true,
    orientation: "vertical"
  };

  var ideogram = new Ideogram(config);

  console.log('ideogram.chromosomes');
  console.log(ideogram.chromosomes);
  console.log('ideogram.chromosomes["9606"]');
  console.log(ideogram.chromosomes["9606"]);

  var numChromosomes = Object.keys(ideogram.chromosomes["9606"]).length;
  assert.equal(numChromsomes, 24);

  });


});
