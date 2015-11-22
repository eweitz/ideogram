var assert = require('chai').assert;
var exec = require('child_process').exec;
var fs = require('fs');

describe("Ideogram CLI", function() {

  it("should run the built-in example", function(done) {

    this.timeout(10000);
    var numImages = 100;

    var cmd =
    'ideogram ' +
      '--taxid 9606 ' +
      '--chromosomes 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,X,Y ' +
      '--chr-width 10 ' +
      '--chr-height 500 ' +
      '--chr-margin 10 ' +
      '--show-band-labels true ' +
      '--show-chromosome-labels true ' +
      '--orientation horizontal ' +
      '--local-annotations-path data/annotations/' + numImages + '_virtual_snvs.json';

    exec(cmd, function(error, stdout, stderr) {
      console.log('ideogram cli, error:')
      console.log(error)
      console.log('ideogram cli, stdout:')
      console.log(stderr)
      console.log('ideogram cli, stderr:')
      console.log(stderr)
      var images = fs.readdirSync('images');
      assert.equal(numImages, images.length);
      done();
    })

  });

});
