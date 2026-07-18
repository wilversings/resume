const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './js/main.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash:8].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(woff2?|ttf|eot|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'fonts/[name][ext]' },
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash:8].css' }),
      new HtmlWebpackPlugin({ template: './index.html' }),
      // Obfuscation runs after Terser has already minified the bundle, adding
      // control-flow flattening / string-array encoding on top of that output.
      ...(isProduction
        ? [
            new WebpackObfuscator(
              {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
                rotateStringArray: true,
                selfDefending: true,
                identifierNamesGenerator: 'hexadecimal',
                renameGlobals: false,
              },
              []
            ),
          ]
        : []),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: { format: { comments: false } },
        }),
        new CssMinimizerPlugin(),
      ],
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, '.'),
        watch: {
          ignored: [
            path.resolve(__dirname, 'design/**'),
            path.resolve(__dirname, 'node_modules/**'),
            path.resolve(__dirname, 'dist/**'),
            path.resolve(__dirname, '.git/**'),
            path.resolve(__dirname, 'AGENTS.md'),
            path.resolve(__dirname, 'README.md'),
          ],
        },
      },
      port: 8080,
      open: true,
    },
    devtool: isProduction ? false : 'eval-source-map',
  };
};
