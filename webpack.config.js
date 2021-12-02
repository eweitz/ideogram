const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const ideogramVersion = packageJson.version;

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'ideogram.min.js',
    path: path.resolve(__dirname, 'dist/js'),
    publicPath: '/dist/js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    publicPath: '/dist/js',
  },
  devtool: 'source-map',
  devServer: {
    static: './',
    historyApiFallback: {
      rewrites: [{
        from: /^\/examples\/vanilla\/.*$/,
        to: function(context) {
          if (context.match === '/examples/vanilla/') {
            return context.match + '/index.html';
          } else {
            return context.match + '.html';
          }
        }
      }]
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }

    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: (
        'Ideogram.js, version ' + ideogramVersion + '.  ' +
        'Developed by Eric Weitz.  https://github.com/eweitz/ideogram.  ' +
        'Public domain (CC0 1.0).'
      ),
      entryOnly: true
    })
  ]
};
