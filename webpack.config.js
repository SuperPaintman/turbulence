'use strict';
/* Imports */
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const sveltePreprocess = require('svelte-preprocess');

/* Init */
const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

const srcPath = path.join(__dirname, 'src');
const imagesPath = path.join(__dirname, 'src/images/');
const outputPath = path.join(__dirname, 'public');

/* Helpers */
function maybeCall(fn) {
  return typeof fn === 'function' ? fn() : fn;
}

function filter(array) {
  return array.filter((item) => !!item);
}

function only(isIt, fn, fall) {
  if (!isIt) {
    return fall !== undefined ? maybeCall(fall) : null;
  }

  return maybeCall(fn);
}

const onlyProd = (fn, fall) => only(prod, fn, fall);
const onlyDev = (fn, fall) => only(!prod, fn, fall);

/* Config */
module.exports = filter([
  /* Extension */
  {
    mode,
    entry: {
      popup: path.join(srcPath, 'extension/popup.ts')
    },
    output: {
      path: path.join(outputPath, 'extension'),
      filename: `[name]${onlyProd('.[chunkhash]', '')}.js`,
      chunkFilename: `[name]${onlyProd('.[chunkhash]', '')}.chunk.js`,
      sourceMapFilename: '[file].map',
      publicPath: ''
    },
    devtool: onlyDev('source-map', false),
    resolve: {
      alias: {
        svelte: path.dirname(require.resolve('svelte/package.json')),
        images: imagesPath,
        '~': srcPath
      },
      extensions: ['.ts', '.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main']
    },
    plugins: filter([
      /* Clean */
      new CleanWebpackPlugin(),

      /* Manifest */
      new WebpackManifestPlugin({
        generate(seed, files, entries) {
          const popup = files.find((f) => f.chunk.name === 'popup');

          const pkg = require('./package.json');

          const manifest = {
            manifest_version: 2
          };

          if (pkg.name) {
            manifest.name = pkg.name;
          }

          manifest.version = pkg.version || '0.0.0';

          manifest.permissions = ['tabs'];

          if (popup) {
            if (!manifest.browser_action) {
              manifest.browser_action = {};
            }

            manifest.browser_action.default_popup = 'popup.html';
          }

          return manifest;
        }
      }),

      /* HTML */
      new HtmlWebpackPlugin({
        template: path.join(srcPath, 'extension/popup.html'),
        filename: 'popup.html',
        chunks: ['popup'],
        cache: true
      }),

      /* CSS */
      new MiniCssExtractPlugin({
        filename: `[name]${onlyProd('.[chunkhash]', '')}.css`,
        chunkFilename: `[name]${onlyProd('.[chunkhash]', '')}.chunk.css`
      })
    ]),
    module: {
      rules: filter([
        /* TypeScript */
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },

        /* Svelte */
        {
          test: /\.svelte$/,
          use: {
            loader: 'svelte-loader',
            options: {
              compilerOptions: {
                dev: !prod
              },
              emitCss: prod,
              preprocess: sveltePreprocess({ sourceMap: !prod })
            }
          }
        },
        {
          // required to prevent errors from Svelte on Webpack 5+
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false
          }
        },

        /* CSS */
        {
          test: /\.css$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [['postcss-css-variables', { preserve: false }]]
                }
              }
            }
          ]
        }
      ])
    }
  },
  /* Debug */
  {
    mode,
    entry: {
      main: path.join(srcPath, 'debug/index.ts')
    },
    output: {
      path: path.join(outputPath, 'debug'),
      filename: `js/[name]${onlyProd('.[chunkhash]', '')}.js`,
      chunkFilename: `js/[name]${onlyProd('.[chunkhash]', '')}.chunk.js`,
      sourceMapFilename: '[file].map',
      publicPath: '/'
    },
    devtool: onlyDev('source-map', false),
    resolve: {
      alias: {
        svelte: path.dirname(require.resolve('svelte/package.json')),
        images: imagesPath,
        '~': srcPath
      },
      extensions: ['.ts', '.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main']
    },
    plugins: filter([
      /* Clean */
      new CleanWebpackPlugin(),

      /* HTML */
      new HtmlWebpackPlugin({
        template: path.join(srcPath, 'debug/index.html'),
        filename: 'index.html',
        cache: true
      }),

      /* CSS */
      new MiniCssExtractPlugin({
        filename: `css/[name]${onlyProd('.[chunkhash]', '')}.css`,
        chunkFilename: `css/[name]${onlyProd('.[chunkhash]', '')}.chunk.css`
      })
    ]),
    module: {
      rules: filter([
        /* TypeScript */
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },

        /* Svelte */
        {
          test: /\.svelte$/,
          use: {
            loader: 'svelte-loader',
            options: {
              compilerOptions: {
                dev: !prod
              },
              emitCss: prod,
              hotReload: !prod,
              hotOptions: {
                noPreserveState: false,
                optimistic: true
              },
              preprocess: sveltePreprocess({ sourceMap: !prod })
            }
          }
        },
        {
          // required to prevent errors from Svelte on Webpack 5+
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false
          }
        },

        /* CSS */
        {
          test: /\.css$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [['postcss-css-variables', { preserve: false }]]
                }
              }
            }
          ]
        }
      ])
    },
    devServer: {
      hot: true,
      contentBase: path.join(outputPath, 'debug'),
      stats: 'errors-only',
      watchContentBase: true,
      port: 8081
    }
  }
]);
