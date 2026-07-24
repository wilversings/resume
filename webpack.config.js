const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

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
        {
          test: /\.svg$/i,
          type: 'asset/inline',
          use: [{ loader: 'svgo-loader' }],
        },
        {
          test: /\.(png|jpe?g)$/i,
          type: 'asset/resource',
          generator: { filename: 'images/[name].[contenthash:8][ext]' },
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash:8].css' }),
      new HtmlWebpackPlugin({
        template: './index.html',
        favicon: './images/logo-mark.svg',
        // TODO: replace with the real production domain once it's live
        siteUrl: 'https://wilversings.github.io',
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: {
              passes: 2,
              drop_console: true,
              drop_debugger: true,
            },
            format: { comments: false },
          },
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
