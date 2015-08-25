var requirejs = require('requirejs');
requirejs.config({nodeRequire: require});
var chai = require("chai");
var expect = chai.expect;
var assert = require("assert");

describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});

requirejs(['../src/js/ideogram.js'], function(ideogramjs) {
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

  var ideogram = new ideogramjs(config);
  console.log("ideogram:");
  console.log(ideogram);

  assert.equal(ideogramjs.config.container, ".small-ideogram");

  });  

});
});
