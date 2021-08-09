/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable import/no-commonjs */
/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
import fs from 'fs'
import glob from 'glob'
import path from 'path'

import webpack from 'webpack'
import WebpackNotifierPlugin from 'webpack-notifier'
import autoprefixer from 'autoprefixer'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import TimeFixPlugin from 'time-fix-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import LoadablePlugin from '@loadable/webpack-plugin'
import {createModuleReplacementPlugin, BuildMarkerPlugin} from './plugins'

const root = process.cwd()
const {resolve, join} = path

const pkg = require(resolve(root, 'package.json'))
const nodeModules = resolve(root, 'node_modules')
const appDir = resolve(root, 'app')
const buildDir = resolve(root, 'build')

const production = 'production'
const development = 'development'
const modes = [production, development]
const analyzeBundle = process.env.MOBIFY_ANALYZE === 'true'
const mode = process.env.NODE_ENV === production ? production : development
const DEBUG = mode !== production && process.env.DEBUG === 'true'
const CI = process.env.CI
const requestProcessorPath = resolve(appDir, 'request-processor.js')

if (modes.indexOf(mode) < 0) {
    throw new Error(`Mode '${mode}' must be one of '${modes.toString()}'`)
}

const buildMarkerPlugin = new BuildMarkerPlugin({
    filename: resolve(root, 'build', 'build.marker')
})

const replacements = [
    {
        path: join('progressive-web-sdk', 'dist', 'ssr', 'universal', 'components', '_app-config'),
        newPath: resolve('.', 'app', 'components', '_app-config', 'index.jsx')
    },
    {
        path: join(
            'progressive-web-sdk',
            'dist',
            'ssr',
            'universal',
            'components',
            '_amp-document'
        ),
        newPath: resolve('.', 'app', 'components', '_amp-document', 'index.jsx')
    },
    {
        path: join(
            'progressive-web-sdk',
            'dist',
            'ssr',
            'universal',
            'components',
            '_pwa-document'
        ),
        newPath: resolve('.', 'app', 'components', '_pwa-document', 'index.jsx')
    },
    {
        path: join('progressive-web-sdk', 'dist', 'ssr', 'universal', 'components', '_amp-app'),
        newPath: resolve('.', 'app', 'components', '_amp-app', 'index.jsx')
    },
    {
        path: join('progressive-web-sdk', 'dist', 'ssr', 'universal', 'components', '_pwa-app'),
        newPath: resolve('.', 'app', 'components', '_pwa-app', 'index.jsx')
    },
    {
        path: join('progressive-web-sdk', 'dist', 'ssr', 'universal', 'components', '_error'),
        newPath: resolve('.', 'app', 'components', '_error', 'index.jsx')
    },
    {
        path: join('progressive-web-sdk', 'dist', 'ssr', 'universal', 'routes'),
        newPath: resolve('.', 'app', 'routes.jsx')
    }
].filter(({newPath}) => fs.existsSync(newPath))

const moduleReplacementPlugin = createModuleReplacementPlugin({replacements})

const defines = {
    // This is defined as a boolean, not a string
    MESSAGING_ENABLED: `${pkg.messagingEnabled}`,
    WEBPACK_NON_PWA_ENABLED: `${pkg.nonPwaEnabled}`,
    NATIVE_WEBPACK_ASTRO_VERSION: `'0.0.1'`, // TODO
    MESSAGING_SITE_ID: `'${pkg.messagingSiteId}'`,
    // This is for internal Mobify test use
    MOBIFY_CONNECTOR_NAME: `'${process.env.MOBIFY_CONNECTOR_NAME}'`,
    // These are defined as string constants
    PROJECT_SLUG: `'${pkg.projectSlug}'`,
    AJS_SLUG: `'${pkg.aJSSlug}'`,
    SITE_NAME: `"${pkg.siteName}"`,
    WEBPACK_PACKAGE_JSON_MOBIFY: `${JSON.stringify(pkg.mobify || {})}`,
    WEBPACK_SSR_ENABLED: pkg.mobify ? `${pkg.mobify.ssrEnabled}` : 'false',
    WEBPACK_SITE_URL: `'${pkg.siteUrl}'`,
    DEBUG,
    WEBPACK_PAGE_NOT_FOUND_URL: `'${(pkg.mobify || {}).pageNotFoundURL || ''}' `,
    NODE_ENV: `'${process.env.NODE_ENV}'`,
    ['global.GENTLY']: false
}

/**
 * We use this trick to make it possible to swap connectors used by the scaffold
 * during development by changing the MOBIFY_CONNECTOR_NAME env var. We don't
 * expect end-users to do this. Note that require('mobify-test-connector') in
 * code will return *different modules* depending on the value of the env var.
 */
const getConnectorPath = () => {
    const name = process.env.MOBIFY_CONNECTOR_NAME || 'demo-connector'
    return path.resolve(nodeModules, '@mobify', 'commerce-integrations', 'dist', 'connectors', name)
}

const minimizer = (mode) => {
    switch (mode) {
        case production:
            return [
                new TerserPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: true
                })
            ]
        case development:
            return [
                new TerserPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: true,
                    terserOptions: {
                        ie8: false,
                        mangle: false,
                        warnings: false,
                        compress: false
                    }
                })
            ]
        default:
            throw new Error(`Invalid mode ${mode}`)
    }
}

const cssLoader = [
    MiniCssExtractPlugin.loader,
    {
        loader: 'css-loader?-autoprefixer',
        options: {
            // Don't use automatic URL transforms
            url: false
        }
    },
    {
        loader: 'postcss-loader',
        options: {
            plugins: [
                autoprefixer({
                    // Don't remove outdated prefixes. Speeds up build time.
                    remove: false
                })
            ]
        }
    }
]

const sassLoader = cssLoader.concat(['sass-loader'])

const babelLoader = [
    {
        loader: 'babel-loader?cacheDirectory',
        options: {
            rootMode: 'upward'
        }
    }
]

// Avoid compiling server-side only libraries with webpack by setting the
// webpack `externals` configuration. This values originates from the mobify
// configuration object under `externals` in the projects package.json file.
const mobifyConfig = pkg.mobify || {}

// Convert the externals defined in your project with the defualts into an
// object that webpack will understand.
const externals = ['express', ...(mobifyConfig.externals || [])].reduce(
    (acc, lib) => ({...acc, [lib]: lib}),
    {}
)

const stats = {
    all: false,
    modules: false,
    errors: true,
    warnings: true,
    moduleTrace: true,
    errorDetails: true,
    colors: true,
    assets: false,
    excludeAssets: [/.*img\/.*/, /.*svg\/.*/, /.*json\/.*/, /.*static\/.*/]
}

const common = {
    mode,
    // Reduce amount of output in terminal
    stats,
    // Create source maps for all files
    devtool: 'source-map',

    output: {
        path: buildDir,
        filename: '[name].js',
        chunkFilename: '[name].js' // Support chunking with @loadable/components
    },
    // Tell webpack how to find specific modules
    resolve: {
        symlinks: false,
        extensions: ['.js', '.jsx', '.json'],
        alias: {
            '@loadable/components': resolve(nodeModules, '@loadable/components'),
            '@loadable/server': resolve(nodeModules, '@loadable/server'),
            '@loadable/webpack-plugin': resolve(nodeModules, '@loadable/webpack-plugin'),
            'babel-runtime': resolve(nodeModules, 'babel-runtime'),
            lodash: resolve(nodeModules, 'lodash'),
            'lodash-es': resolve(nodeModules, 'lodash'),
            'lodash._basefor': resolve(nodeModules, 'lodash', '_baseFor'),
            'lodash.escaperegexp': resolve(nodeModules, 'lodash', 'escapeRegExp'),
            'lodash.find': resolve(nodeModules, 'lodash', 'find'),
            'lodash.frompairs': resolve(nodeModules, 'lodash', 'fromPairs'),
            'lodash.isarray': resolve(nodeModules, 'lodash', 'isArray'),
            'lodash.isarguments': resolve(nodeModules, 'lodash', 'isArguments'),
            'lodash.intersection': resolve(nodeModules, 'lodash', 'intersection'),
            'lodash.isplainobject': resolve(nodeModules, 'lodash', 'isPlainObject'),
            'lodash.keys': resolve(nodeModules, 'lodash', 'keys'),
            'lodash.keysin': resolve(nodeModules, 'lodash', 'keysIn'),
            'lodash.mapvalues': resolve(nodeModules, 'lodash', 'mapValues'),
            'lodash.throttle': resolve(nodeModules, 'lodash', 'throttle'),
            react: resolve(nodeModules, 'react'),
            'react-router-dom': resolve(nodeModules, 'react-router-dom'),
            'react-dom': resolve(nodeModules, 'react-dom'),
            'react-helmet': resolve(nodeModules, 'react-helmet'),
            bluebird: resolve(nodeModules, 'bluebird'),
            'mobify-test-connector': getConnectorPath()
        }
    },

    plugins: [
        new webpack.DefinePlugin(defines),

        new WebpackNotifierPlugin({
            title: `Mobify Project: ${pkg.name}`,
            excludeWarnings: true,
            skipFirstNotification: true
        }),

        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),

        new CopyPlugin({patterns: [{from: 'app/static/', to: 'static/'}]}),

        analyzeBundle &&
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                defaultSizes: 'gzip',
                openAnalyzer: CI !== 'true',
                generateStatsFile: true
            }),
        mode === development && new webpack.NoEmitOnErrorsPlugin(),

        // Avoid repeat builds with webpack for files created immediately
        // before starting the server.
        // See - https://github.com/webpack/watchpack/issues/25
        new TimeFixPlugin(),

        buildMarkerPlugin,

        moduleReplacementPlugin
    ].filter((x) => !!x),

    module: {
        rules: [
            {
                test: /\.js(x?)$/,
                exclude: /node_modules/,
                use: babelLoader
            },
            {
                test: /\.svg$/,
                use: 'text-loader'
            },
            {
                test: /\.css?$/,
                use: cssLoader
            },
            {
                test: /\.scss$/,
                use: sassLoader,
                include: [/node_modules\/progressive-web-sdk/, /app/]
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: {
                    loader: 'html-loader'
                }
            }
        ]
    },
    externals
}

// The main PWA entry point gets special treatment for chunking
const main = Object.assign({}, common, {
    name: 'pwa-main',
    entry: {
        main: './app/main.jsx'
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // Anything imported from node_modules lands in vendor.js
                    test: /node_modules/,
                    name: 'vendor',
                    chunks: 'all'
                }
            }
        },
        minimizer: minimizer(mode)
    },
    performance: {
        maxEntrypointSize: 905000,
        maxAssetSize: 825000
    },
    plugins: [...common.plugins, new LoadablePlugin()]
})

const others = Object.assign({}, common, {
    name: 'pwa-others',
    entry: Object.assign(
        {
            loader: './app/loader.js',
            worker: './worker/main.js',
            'core-polyfill': 'core-js',
            'fetch-polyfill': 'whatwg-fetch'
        },
        glob.sync('./app/translations/*.js').reduce((acc, fileName) => {
            const name = path.basename(fileName).slice(0, -path.extname(fileName).length)
            acc[`translations/${name}`] = fileName
            return acc
        }, {})
    ),
    optimization: {
        minimizer: minimizer(mode)
    }
})

/**
 * Configuration for the Express app which is run under Node.
 */
const ssrServerConfig = Object.assign(
    {},
    {
        name: 'ssr-server',
        mode,
        devtool: 'cheap-source-map', // Always use source map, makes debugging the server much easier.
        entry: './app/ssr.js',
        target: 'node',
        output: {
            path: buildDir,
            filename: 'ssr.js',
            libraryTarget: 'commonjs2'
        },
        resolve: {
            extensions: ['.js', '.jsx', '.json'],
            alias: common.resolve.alias
        },
        plugins: [
            new webpack.DefinePlugin(defines),
            // Output a single server file for faster Lambda startup
            new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
            buildMarkerPlugin,
            moduleReplacementPlugin
        ],
        externals,
        module: {
            rules: [
                {
                    test: /\.js(x?)$/,
                    exclude: /node_modules/,
                    use: babelLoader
                },
                {
                    test: /\.svg$/,
                    use: 'text-loader'
                }
            ]
        },
        stats
    },
    mode === production
        ? {
              optimization: {
                  minimizer: [
                      new TerserPlugin({
                          terserOptions: {
                              compress: false,
                              mangle: false,
                              ecma: 6
                          }
                      })
                  ]
              }
          }
        : undefined
)

const requestProcessor = Object.assign(
    {},
    {
        entry: './app/request-processor.js',
        target: 'node',
        mode,
        output: {
            path: resolve(process.cwd(), 'build'),
            filename: 'request-processor.js',
            // Output a CommonJS module for use in Node
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: babelLoader
                }
            ]
        },
        stats
    }
)

const entries = [main, ssrServerConfig, others]

if (fs.existsSync(requestProcessorPath)) {
    entries.push(requestProcessor)
}

module.exports = entries
