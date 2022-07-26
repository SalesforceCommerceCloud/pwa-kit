/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
import fs from 'fs'
import path, {resolve} from 'path'

import webpack from 'webpack'
import WebpackNotifierPlugin from 'webpack-notifier'
import CopyPlugin from 'copy-webpack-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import LoadablePlugin from '@loadable/webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin'

import {createModuleReplacementPlugin} from './plugins'
import {CLIENT, SERVER, CLIENT_OPTIONAL, SSR, REQUEST_PROCESSOR} from './config-names'

const projectDir = process.cwd()
const sdkDir = resolve(path.join(__dirname, '..', '..', '..'))

const pkg = require(resolve(projectDir, 'package.json'))
const buildDir = process.env.PWA_KIT_BUILD_DIR
    ? resolve(process.env.PWA_KIT_BUILD_DIR)
    : resolve(projectDir, 'build')

const production = 'production'
const development = 'development'
const analyzeBundle = process.env.MOBIFY_ANALYZE === 'true'
const mode = process.env.NODE_ENV === production ? production : development
const DEBUG = mode !== production && process.env.DEBUG === 'true'
const CI = process.env.CI
const disableHMR = process.env.HMR === 'false'

if ([production, development].indexOf(mode) < 0) {
    throw new Error(`Invalid mode "${mode}"`)
}

const getBundleAnalyzerPlugin = (name = 'report', pluginOptions) =>
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        defaultSizes: 'gzip',
        openAnalyzer: CI !== 'true',
        generateStatsFile: true,
        reportFilename: `${name}.html`,
        reportTitle: `${name} bundle analysis result`,
        statsFilename: `${name}-analyzer-stats.json`,
        ...pluginOptions
    })

const entryPointExists = (segments) => {
    for (let ext of ['.js', '.jsx', '.ts', '.tsx']) {
        const p = resolve(projectDir, ...segments) + ext
        if (fs.existsSync(p)) {
            return true
        }
    }
    return false
}

const findInProjectThenSDK = (pkg) => {
    const projectPath = resolve(projectDir, 'node_modules', pkg)
    return fs.existsSync(projectPath) ? projectPath : resolve(sdkDir, 'node_modules', pkg)
}

const baseConfig = (target) => {
    if (!['web', 'node'].includes(target)) {
        throw Error(`The value "${target}" is not a supported webpack target`)
    }

    class Builder {
        constructor() {
            this.config = {
                target,
                mode,
                ...(target === 'node'
                    ? {
                          ignoreWarnings: [
                              // These can be ignored fairly safely for node targets, where
                              // bundle size is not super critical. Express generates this warning,
                              // because it uses dynamic require() calls, which cause Webpack to
                              // bundle the whole library.
                              /Critical dependency: the request of a dependency is an expression/
                          ]
                      }
                    : {}),
                infrastructureLogging: {
                    level: 'error'
                },
                stats: {
                    all: false,
                    modules: false,
                    errors: true,
                    warnings: true,
                    moduleTrace: true,
                    errorDetails: true,
                    colors: true,
                    assets: false,
                    excludeAssets: [/.*img\/.*/, /.*svg\/.*/, /.*json\/.*/, /.*static\/.*/]
                },
                optimization: {
                    minimize: mode === production
                },
                output: {
                    publicPath: '',
                    path: buildDir
                },
                resolve: {
                    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
                    alias: {
                        'babel-runtime': findInProjectThenSDK('babel-runtime'),
                        '@tanstack/react-query': findInProjectThenSDK('@tanstack/react-query'),
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
                        'webpack-hot-middleware': findInProjectThenSDK('webpack-hot-middleware')
                    },
                    ...(target === 'web' ? {fallback: {crypto: false}} : {})
                },

                plugins: [
                    new webpack.DefinePlugin({
                        DEBUG,
                        NODE_ENV: `'${process.env.NODE_ENV}'`,
                        WEBPACK_TARGET: `'${target}'`,
                        ['global.GENTLY']: false
                    }),

                    mode === development && new webpack.NoEmitOnErrorsPlugin(),

                    createModuleReplacementPlugin(projectDir),

                    // Don't chunk if it's a node target – faster Lambda startup.
                    target === 'node' && new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1})
                ].filter(Boolean),

                module: {
                    rules: [
                        ruleForBabelLoader(),
                        target === 'node' && {
                            test: /\.svg$/,
                            loader: findInProjectThenSDK('svg-sprite-loader')
                        },
                        target === 'web' && {
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
            }
        }

        extend(callback) {
            this.config = callback(this.config)
            return this
        }

        build() {
            // Clean up temporary properties, to be compatible with the config schema
            this.config.module.rules.filter((rule) => rule.id).forEach((rule) => delete rule.id)

            return this.config
        }
    }
    return new Builder()
}

const withChunking = (config) => {
    return {
        ...config,
        output: {
            ...config.output,
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
        }
    }
}

const ruleForBabelLoader = (babelPlugins) => {
    return {
        id: 'babel-loader',
        test: /(\.js(x?)|\.ts(x?))$/,
        exclude: /node_modules/,
        use: [
            {
                loader: findInProjectThenSDK('babel-loader'),
                options: {
                    rootMode: 'upward',
                    cacheDirectory: true,
                    ...(babelPlugins ? {plugins: babelPlugins} : {})
                }
            }
        ]
    }
}

const findAndReplace = (array = [], findFn = () => {}, replacement) => {
    const clone = array.slice(0)
    const index = clone.findIndex(findFn)
    if (index === -1) {
        return array
    }

    clone.splice(index, 1, replacement)
    return clone
}

const enableReactRefresh = (config) => {
    if (mode !== development || disableHMR) {
        return config
    }

    const newRule = ruleForBabelLoader([require.resolve('react-refresh/babel')])
    const rules = findAndReplace(config.module.rules, (rule) => rule.id === 'babel-loader', newRule)

    return {
        ...config,
        module: {
            ...config.module,
            rules
        },
        entry: {
            ...config.entry,
            main: ['webpack-hot-middleware/client?path=/__mrt/hmr', './app/main']
        },
        plugins: [
            ...config.plugins,

            new webpack.HotModuleReplacementPlugin(),
            new ReactRefreshWebpackPlugin({
                overlay: false
            })
        ],
        output: {
            ...config.output,
            // Setting this so that *.hot-update.json requests are resolving
            publicPath: '/mobify/bundle/development/'
        }
    }
}

const client =
    entryPointExists(['app', 'main']) &&
    baseConfig('web')
        .extend(withChunking)
        .extend((config) => {
            return {
                ...config,
                // Must be named "client". See - https://www.npmjs.com/package/webpack-hot-server-middleware#usage
                name: CLIENT,
                // use source map to make debugging easier
                devtool: mode === development ? 'source-map' : false,
                entry: {
                    main: './app/main'
                },
                plugins: [
                    ...config.plugins,
                    new LoadablePlugin({writeToDisk: true}),
                    analyzeBundle && getBundleAnalyzerPlugin(CLIENT)
                ].filter(Boolean),
                // Hide the performance hints, since we already have a similar `bundlesize` check in `template-retail-react-app` package
                performance: {
                    hints: false
                }
            }
        })
        .extend(enableReactRefresh)
        .build()

const optional = (name, path) => {
    return fs.existsSync(path) ? {[name]: path} : {}
}

const clientOptional = baseConfig('web')
    .extend((config) => {
        return {
            ...config,
            name: CLIENT_OPTIONAL,
            entry: {
                ...optional('loader', './app/loader.js'),
                ...optional('worker', './worker/main.js'),
                ...optional('core-polyfill', resolve(projectDir, 'node_modules', 'core-js')),
                ...optional('fetch-polyfill', resolve(projectDir, 'node_modules', 'whatwg-fetch'))
            },
            // use source map to make debugging easier
            devtool: mode === development ? 'source-map' : false,
            plugins: [
                ...config.plugins,
                analyzeBundle && getBundleAnalyzerPlugin(CLIENT_OPTIONAL)
            ].filter(Boolean)
        }
    })
    .build()

const renderer =
    fs.existsSync(resolve(projectDir, 'node_modules', 'pwa-kit-react-sdk')) &&
    baseConfig('node')
        .extend((config) => {
            return {
                ...config,
                // Must be named "server". See - https://www.npmjs.com/package/webpack-hot-server-middleware#usage
                name: SERVER,
                entry: 'pwa-kit-react-sdk/ssr/server/react-rendering.js',
                // use eval-source-map for server-side debugging
                devtool: mode === development ? 'eval-source-map' : false,
                output: {
                    path: buildDir,
                    filename: 'server-renderer.js',
                    libraryTarget: 'commonjs2'
                },
                plugins: [
                    ...config.plugins,

                    // Keep this on the slowest-to-build item - the server-side bundle.
                    new WebpackNotifierPlugin({
                        title: `PWA Kit Project: ${pkg.name}`,
                        excludeWarnings: true,
                        skipFirstNotification: true
                    }),

                    // Must only appear on one config – this one is the only mandatory one.
                    new CopyPlugin({
                        patterns: [{from: 'app/static/', to: 'static/'}]
                    }),

                    analyzeBundle && getBundleAnalyzerPlugin('server-renderer')
                ].filter(Boolean)
            }
        })
        .build()

const ssr = (() => {
    // Only compile the ssr file when we're building for prod.
    if (mode === production) {
        return baseConfig('node')
            .extend((config) => {
                return {
                    ...config,
                    // Must *not* be named "server". See - https://www.npmjs.com/package/webpack-hot-server-middleware#usage
                    name: SSR,
                    entry: './app/ssr.js',
                    output: {
                        path: buildDir,
                        filename: 'ssr.js',
                        libraryTarget: 'commonjs2'
                    },
                    plugins: [
                        ...config.plugins,
                        analyzeBundle && getBundleAnalyzerPlugin(SSR)
                    ].filter(Boolean)
                }
            })
            .build()
    } else {
        return undefined
    }
})()

const requestProcessor =
    entryPointExists(['app', 'request-processor']) &&
    baseConfig('node')
        .extend((config) => {
            return {
                ...config,
                name: REQUEST_PROCESSOR,
                entry: './app/request-processor.js',
                output: {
                    path: buildDir,
                    filename: 'request-processor.js',
                    libraryTarget: 'commonjs2'
                },
                // use eval-source-map for server-side debugging
                devtool: mode === development ? 'eval-source-map' : false,
                plugins: [
                    ...config.plugins,
                    analyzeBundle && getBundleAnalyzerPlugin(REQUEST_PROCESSOR)
                ].filter(Boolean)
            }
        })
        .build()

module.exports = [client, ssr, renderer, clientOptional, requestProcessor]
    .filter(Boolean)
    .map((config) => {
        return new SpeedMeasurePlugin({disable: !process.env.MEASURE}).wrap(config)
    })
