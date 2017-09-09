var path = require('path');

// Karma configuration
// Generated on Thu Jun 29 2017 21:00:08 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/d3/build/d3.min.js',
      'src/js/index.js',
      'test/web-test.js',
      {pattern: 'dist/data/**', watched: false, included: false, served: true, nocache: false}
    ],

    proxies: {
      '/dist/data': '/base/dist/data'
    },

    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/js/index.js': 'webpack'
    },


    webpack: {
      module: {
        rules: [
          // instrument only testing sources with Istanbul
          {
            test: /\.js$/,
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: {
                esModules: true
              }
            },
            include: path.resolve('src/js/')
          }
        ]
      }
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage-istanbul', 'coverage', 'coveralls'],

    coverageReporter: {
      type: 'lcov', // lcov or lcovonly are required for generating lcov.info files
      dir: 'coverage/'
    },

    coverageIstanbulReporter: {
      reports: ['text', 'html'],
      fixWebpackSourcePaths: true
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
