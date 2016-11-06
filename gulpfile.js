var gulp = require('gulp');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var mocha = require('gulp-mocha');
var minify = require('gulp-minify');
var concat = require('gulp-concat');
var flatten = require('gulp-flatten');
var ignore = require('gulp-ignore');
var order = require('gulp-order');
var jshint = require('gulp-jshint');

gulp.task('default', function () {

  gulp
    .src('test/web-runner.html')
    .pipe(mochaPhantomJS({reporter: 'spec', dump:'test.log'}))

  // gulp.src('test/cli-test.js', {read: false})
    //// gulp-mocha needs filepaths so you can't have any plugins before it
    // .pipe(mocha({reporter: 'spec'}));

});

gulp.task('lint', function() {
  return gulp.src('src/js/**/*.js')
    .pipe(flatten())
    .pipe(ignore.exclude(['ideogram.min.js']))
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('dist', function() {
  gulp.src('src/js/**/*.js')
    .pipe(flatten())
    .pipe(ignore.exclude(['ideogram.min.js']))
    .pipe(order([
        'range.js',
        'modelAdapter.js',
        'modelNoBandsAdapter.js',
        'layout.js',
        'horizontalLayout.js',
        'verticalLayout.js',
        'pairedLayout.js',
        'smallLayout.js',
        'ploidy.js',
        'color.js',
        'ploidyDescription.js',
        'chromosome.js',
        'telocentricChromosome.js',
        'metacentricChromosome.js',
        'ideogram.js',
        'ideogram.filter.js'
    ]))
    .pipe(concat('ideogram.js'))
    .pipe(minify({
        ext:{
            src:'.js',
            min:'.min.js'
        }
    }))
    .pipe(gulp.dest('dist'))
});