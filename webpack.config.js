const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
let WebpackObfuscator;
try {
  WebpackObfuscator = require('webpack-obfuscator');
} catch (e) {
  console.warn('webpack-obfuscator not installed. Skipping obfuscation.');
  WebpackObfuscator = null;
}

module.exports = {
  entry: {
    main: './src/js/main.js',
    kmz: './src/js/kmz-tool.js'
  },
  output: {
    filename: '[name].bundle.js', // will create main.bundle.js and kmz.bundle.js
    path: path.resolve(__dirname, 'dist'),
    clean: true, // clean old builds
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: WebpackObfuscator
    ? [new WebpackObfuscator({ rotateStringArray: true }, [])]
    : [],
  devtool: 'source-map', // optional: helps debug minified code
};
