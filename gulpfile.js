var gulp = require('gulp');
var mochaPhantomJS = require('gulp-mocha-phantomjs');

gulp.task('default', function () {
    return gulp
    .src('test/runner.html')
    .pipe(mochaPhantomJS({reporter: 'spec', dump:'test.log'}));
});
