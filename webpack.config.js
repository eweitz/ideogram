const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'ideogram.min.js',
    path: path.resolve(__dirname, 'dist/js')
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      }

    ]
  }
};
