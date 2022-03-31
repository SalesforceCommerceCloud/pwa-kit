/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
const fs = require('fs')

const path = require('path')
const {resolve} = path

const webpack = require('webpack')
const WebpackNotifierPlugin = require('webpack-notifier')
const CopyPlugin = require('copy-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const LoadablePlugin = require('@loadable/webpack-plugin')
const {createModuleReplacementPlugin} = require('pwa-kit-build/configs/webpack/plugins')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const projectDir = process.cwd()
const sdkDir = path.resolve(path.join(__dirname, '..', '..', '..'))
const pkg = require(resolve(projectDir, 'package.json'))
const buildDir = resolve(projectDir, 'build')

const production = 'production'
const development = 'development'
const analyzeBundle = process.env.MOBIFY_ANALYZE === 'true'
const mode = process.env.NODE_ENV === production ? production : development
const DEBUG = mode !== production && process.env.DEBUG === 'true'
const CI = process.env.CI

if ([production, development].indexOf(mode) < 0) {
    throw new Error(`Invalid mode "${mode}"`)
}

const findInProjectThenSDK = (pkg) => {
    const projectPath = resolve(projectDir, 'node_modules', pkg)
    return fs.existsSync(projectPath) ? projectPath : resolve(sdkDir, 'node_modules', pkg)
}

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
    infrastructureLogging: {
        level: 'error'
    },
    optimization: {
        minimize: mode === production
    },
    output: {
        publicPath: '',
        path: buildDir
    },
    // Tell webpack how to find specific modules
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            'babel-runtime': findInProjectThenSDK('babel-runtime'),
            '@loadable/component': findInProjectThenSDK('@loadable/component'),
            '@loadable/server': findInProjectThenSDK('@loadable/server'),
            '@loadable/webpack-plugin': findInProjectThenSDK(
                '@loadable/webpack-plugin'
            ),
            'svg-sprite-loader': findInProjectThenSDK('svg-sprite-loader'),
            react: findInProjectThenSDK('react'),
            'react-router-dom': findInProjectThenSDK('react-router-dom'),
            'react-dom': findInProjectThenSDK('react-dom'),
            'react-helmet': findInProjectThenSDK('react-helmet'),
            bluebird: findInProjectThenSDK('bluebird')
        }
    },

    plugins: [
        analyzeBundle &&
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                defaultSizes: 'gzip',
                openAnalyzer: CI !== 'true',
                generateStatsFile: true
            }),
        mode === development && new webpack.NoEmitOnErrorsPlugin(),

        createModuleReplacementPlugin(projectDir)
    ].filter((x) => !!x)
}

const client = Object.assign({}, common, {
    name: 'client',
    target: 'web',
    entry: {
        main: './app/main'
    },
    plugins: [
        new webpack.DefinePlugin({
            DEBUG,
            NODE_ENV: `'${process.env.NODE_ENV}'`,
            WEBPACK_TARGET: 'web',
            ['global.GENTLY']: false
        }),

        analyzeBundle &&
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                defaultSizes: 'gzip',
                openAnalyzer: CI !== 'true',
                generateStatsFile: true
            }),
        mode === development && new webpack.NoEmitOnErrorsPlugin(),

        createModuleReplacementPlugin(projectDir),
        new LoadablePlugin({writeToDisk: true})
    ].filter((x) => !!x),
    output: {
        publicPath: '',
        path: buildDir,
        filename: '[name].js',
        chunkFilename: '[name].js' // Support chunking with @loadable/components
    },
    optimization: {
        minimize: mode === production,
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // Anything imported from node_modules lands in
                    // vendor.js, if we're chunking.
                    test: /node_modules/,
                    name: 'vendor',
                    chunks: 'all'
                }
            }
        }
    },
    performance: {
        maxEntrypointSize: 905000,
        maxAssetSize: 825000
    },
    module: {
        rules: [
            {
                test: /(\.js(x?)|\.ts(x?))$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: findInProjectThenSDK('babel-loader'),
                        options: {
                            rootMode: 'upward',
                            cacheDirectory: true
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                loader: findInProjectThenSDK('ignore-loader')
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: {
                    loader: findInProjectThenSDK('html-loader')
                }
            }
        ].filter(Boolean)
    }
})


const optional = (name, path) => {
    return fs.existsSync(path) ? {[name]: path} : {}
}

const clientOptional = Object.assign({}, common, {
    name: 'pwa-others',
    target: 'web',
    entry: {
        ...optional('loader', './app/loader.js'),
        ...optional('worker', './worker/main.js'),
        ...optional('core-polyfill', resolve(projectDir, 'node_modules', 'core-js')),
        ...optional('fetch-polyfill', resolve(projectDir, 'node_modules', 'whatwg-fetch'))
    }
})

const renderer = Object.assign({}, common, {
    name: 'server',
    target: 'node',
    entry: 'pwa-kit-react-sdk/ssr/server/react-rendering.js',
    output: {
        path: buildDir,
        filename: 'server-renderer.js',
        libraryTarget: 'commonjs2'
    },
    plugins: [
        new webpack.DefinePlugin({
            DEBUG,
            NODE_ENV: `'${process.env.NODE_ENV}'`,
            WEBPACK_TARGET: 'node',
            ['global.GENTLY']: false
        }),

        analyzeBundle &&
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                defaultSizes: 'gzip',
                openAnalyzer: CI !== 'true',
                generateStatsFile: true
            }),
        mode === development && new webpack.NoEmitOnErrorsPlugin(),

        createModuleReplacementPlugin(projectDir),

        // Don't chunk if it's a node target – faster Lambda startup.
        new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
        
        // Keep this on the slowest-to-build item - the server-side bundle.
        new WebpackNotifierPlugin({
            title: `Mobify Project: ${pkg.name}`,
            excludeWarnings: true,
            skipFirstNotification: true
        }),

        // Must only appear on one config – this one is the only mandatory one.
        new CopyPlugin({
            patterns: [
                {from: 'app/static/', to: 'static/'},
                {
                    from: 'config/',
                    to: 'config/',
                    globOptions: {
                        ignore: ['**/local.*']
                    }
                }
            ]
                }),
        
        // Don't chunk if it's a node target – faster Lambda startup.
        new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1})
    ].filter((x) => !!x),
    module: {
        rules: [
            {
                test: /(\.js(x?)|\.ts(x?))$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: findInProjectThenSDK('babel-loader'),
                        options: {
                            rootMode: 'upward',
                            cacheDirectory: true
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                loader: findInProjectThenSDK('svg-sprite-loader')
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: {
                    loader: findInProjectThenSDK('html-loader')
                }
            }
        ].filter(Boolean)
    }
})

/**
 * Configuration for the Express app which is run under Node.
 */
const ssr = Object.assign(
    common,
    {
        name: 'ssr',
        target: 'node',
        entry: './app/ssr.js',
        output: {
            path: buildDir,
            filename: 'ssr.js',
            libraryTarget: 'commonjs2'
        }
    }
)

const requestProcessor = Object.assign(
    common,
    {
        name: 'request-processor',
        entry: './app/request-processor.js',
        target: 'node',
        mode,
        output: {
            path: buildDir,
            filename: 'request-processor.js',
            libraryTarget: 'commonjs2'
        }
    }
)

const entries = [client, ssr, renderer, clientOptional, requestProcessor]
    .filter(Boolean)
    .map((config) => {
        return new SpeedMeasurePlugin({disable: !process.env.MEASURE}).wrap(config)
    })

module.exports = entries