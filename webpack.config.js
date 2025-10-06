const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
let WebpackObfuscator;
try {
  WebpackObfuscator = require('webpack-obfuscator');
} catch (e) {
  console.warn('webpack-obfuscator not installed. Skipping obfuscation.');
  WebpackObfuscator = null;
}

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: {
      main: './src/js/main.js',
      kmz: './src/js/kmz-tool.js',
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: isDev ? '/' : 'dist/', // ✅ key difference
    },
    mode: isDev ? 'development' : 'production',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: { presets: ['@babel/preset-env'] },
          },
        },
      ],
    },
    optimization: {
      minimize: !isDev,
      minimizer: [new TerserPlugin()],
    },
    plugins: WebpackObfuscator
      ? [new WebpackObfuscator({ rotateStringArray: true }, [])]
      : [],
    devtool: isDev ? 'source-map' : false,
    devServer: {
      static: {
        directory: path.join(__dirname),
      },
      port: 8080,
      open: true,
      headers: {
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
      },
    },
  };
};
