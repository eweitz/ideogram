describe("DOM Tests", function () {
    var el = document.createElement("div");
    el.id = "myDiv";
    el.innerHTML = "Hi there!";
    el.style.background = "#ccc";
    document.body.appendChild(el);
 
    var myEl = document.getElementById('myDiv');
    it("is in the DOM", function () {
        expect(myEl).to.not.equal(null);
    });
 
    it("is a child of the body", function () {
        expect(myEl.parentElement).to.equal(document.body);
    });
 
    it("has the right text", function () {
        expect(myEl.innerHTML).to.equal("Hi there!");
    });
 
    it("has the right background", function () {
        expect(myEl.style.background).to.equal("rgb(204, 204, 204)");
    });
});

describe("Ideogram", function() {
 
  
  it("should instantiate", function() {

  //console.log("ideogramjs");
  //console.log(ideogramjs);
  //console.log(chai);
 
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
  console.log("ideogram:");
  console.log(ideogram);

  assert.equal(ideogram.config.container, ".small-ideogram");

  });  

});
