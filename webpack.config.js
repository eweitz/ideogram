const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'ideogram.min.js',
    path: path.resolve(__dirname, 'dist/js')
  },
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, '.'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['env', {modules: false}]]
          }
        }
      }

    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: 'Ideogram.js, developed by Eric Weitz. https://github.com/eweitz/ideogram.  Public domain (CC0 1.0).',
      entryOnly: true
    })
  ]
};
