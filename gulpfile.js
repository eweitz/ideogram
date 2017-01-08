var gulp = require('gulp');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var mocha = require('gulp-mocha');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var flatten = require('gulp-flatten');
var ignore = require('gulp-ignore');
var order = require('gulp-order');
var eslint = require('gulp-eslint');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
  scripts: 'src/js/**/*.js',
  styles: 'src/css/**/*.css'
}

gulp.task('default', function () {

  gulp
    .src('test/web-runner.html')
    .pipe(mochaPhantomJS({reporter: 'spec', dump:'test.log'}))

  // gulp.src('test/cli-test.js', {read: false})
    //// gulp-mocha needs filepaths so you can't have any plugins before it
    // .pipe(mocha({reporter: 'spec'}));

});

gulp.task('lint', function() {
  return gulp.src([paths.scripts, '!src/js/lib.js'])
    .pipe(eslint())
    .pipe(eslint.format())
});

gulp.task('dist', function() {
  gulp.src(paths.scripts)
      .pipe(sourcemaps.init())
      .pipe(flatten())
      .pipe(order([
          'range.js',
          'model-adapter.js',
          'model-no-bands-adapter.js',
          'layout.js',
          'horizontal-layout.js',
          'vertical-layout.js',
          'paired-layout.js',
          'small-layout.js',
          'ploidy.js',
          'color.js',
          'ploidy-description.js',
          'chromosome.js',
          'telocentric-chromosome.js',
          'metacentric-chromosome.js',
          'lib.js',
          'core.js',
          'filter.js'
      ]))
      .pipe(concat('ideogram.js'))
      .pipe(gulp.dest('dist/js'))
      .pipe(uglify())
      .pipe(rename({ extname: '.min.js'}))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist/js'))

  gulp.src(paths.styles)
    .pipe(gulp.dest('dist/css'))
});
