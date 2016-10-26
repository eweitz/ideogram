var gulp = require('gulp');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var mocha = require('gulp-mocha');

gulp.task('default', function () {

  gulp
    .src('test/web-runner.html')
    .pipe(mochaPhantomJS({reporter: 'spec', dump:'test.log'}))

  // gulp.src('test/cli-test.js', {read: false})
    //// gulp-mocha needs filepaths so you can't have any plugins before it
    // .pipe(mocha({reporter: 'spec'}));

});
