const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { PDF_FILENAME } = require('./scripts/resume-document');

// build/ is filled by scripts/build-resume.js, which npm runs before webpack.
const BUILD_DIR = path.resolve(__dirname, 'build');

function readResumeArtifact(file) {
  try {
    return fs.readFileSync(path.join(BUILD_DIR, file), 'utf8');
  } catch (e) {
    throw new Error(`build/${file} is missing — run \`npm run build:resume\` first.`);
  }
}

// The PDF isn't in the module graph, and production wipes dist/ on the way in.
const copyResumePdf = (outputPath) => ({
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyResumePdf', () => {
      fs.copyFileSync(path.join(BUILD_DIR, PDF_FILENAME), path.join(outputPath, PDF_FILENAME));
    });
  },
});

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const outputPath = path.resolve(__dirname, 'dist');

  return {
    entry: './js/main.js',
    output: {
      path: outputPath,
      filename: 'js/[name].[contenthash:8].js',
      // Dev-server only: on every HMR rebuild this purges HtmlWebpackPlugin's
      // template-required images from the in-memory fs, 404ing them after the first edit.
      clean: isProduction,
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
          test: /\.(png|jpe?g|avif)$/i,
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
        resumePdfFile: PDF_FILENAME,
        resumePrintBody: readResumeArtifact('resume-print.html'),
      }),
      ...(isProduction ? [copyResumePdf(outputPath)] : []),
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
      static: [
        {
          directory: path.resolve(__dirname, '.'),
          watch: {
            ignored: [
              path.resolve(__dirname, 'design/**'),
              path.resolve(__dirname, 'node_modules/**'),
              path.resolve(__dirname, 'dist/**'),
              path.resolve(__dirname, 'build/**'),
              path.resolve(__dirname, '.git/**'),
              path.resolve(__dirname, 'AGENTS.md'),
              path.resolve(__dirname, 'README.md'),
            ],
          },
        },
        // Serves the résumé PDF at the same path the built site uses, so the
        // hero button resolves in dev too.
        { directory: BUILD_DIR, publicPath: '/', watch: false },
      ],
      port: 8080,
      open: true,
    },
    devtool: isProduction ? false : 'eval-source-map',
  };
};
