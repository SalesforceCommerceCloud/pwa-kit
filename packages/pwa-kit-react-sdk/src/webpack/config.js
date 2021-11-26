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
import {createModuleReplacementPlugin} from './plugins'

const projectDir = process.cwd()
const sdkDir = path.resolve(path.join(__dirname, '..', '..'))

const pkg = require(resolve(projectDir, 'package.json'))
const appDir = resolve(projectDir, 'app')
const buildDir = resolve(projectDir, 'build')

const production = 'production'
const development = 'development'
const modes = [production, development]
const analyzeBundle = process.env.MOBIFY_ANALYZE === 'true'
const mode = process.env.NODE_ENV === production ? production : development
const DEBUG = mode !== production && process.env.DEBUG === 'true'
const CI = process.env.CI

if (modes.indexOf(mode) < 0) {
    throw new Error(`Mode '${mode}' must be one of '${modes.toString()}'`)
}

const findInProjectThenSDK = (pkg) => {
    const projectPath = resolve(projectDir, 'node_modules', pkg)
    return fs.existsSync(projectPath) ? projectPath : resolve(sdkDir, 'node_modules', pkg)
}

const moduleReplacementPlugin = () => {
    const overridables = [
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_app-config$/,
            newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_document$/,
            newPath: resolve(projectDir, 'app', 'components', '_document', 'index'),
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_app$/,
            newPath: resolve(projectDir, 'app', 'components', '_app', 'index'),
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/components\/_error$/,
            newPath: resolve(projectDir, 'app', 'components', '_error', 'index'),
        },
        {
            path: /pwa-kit-react-sdk(\/dist)?\/ssr\/universal\/routes$/,
            newPath: resolve(projectDir, 'app', 'routes'),
        },
    ]
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    const replacements = []
    overridables.forEach(({path, newPath}) => {
        extensions.forEach((ext) => {
            const replacement = newPath + ext
            if (fs.existsSync(replacement)) {
                replacements.push({path, newPath: replacement})
            }
        })
    })

    return createModuleReplacementPlugin({replacements})
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
                stats: {
                    all: false,
                    modules: false,
                    errors: true,
                    warnings: true,
                    moduleTrace: true,
                    errorDetails: true,
                    colors: true,
                    assets: false,
                    excludeAssets: [/.*img\/.*/, /.*svg\/.*/, /.*json\/.*/, /.*static\/.*/],
                },
                devtool: 'source-map',
                output: {
                    publicPath: '',
                    path: buildDir,
                    ...(target === 'node' ? {libraryTarget: 'commonjs2'} : {}),
                },
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
                        bluebird: findInProjectThenSDK('bluebird'),
                    },
                    ...(target === 'web' ? {fallback: {crypto: false}} : {}),
                },

                plugins: [
                    new webpack.DefinePlugin({
                        DEBUG,
                        NODE_ENV: `'${process.env.NODE_ENV}'`,
                        ['global.GENTLY']: false,
                    }),

                    analyzeBundle &&
                        new BundleAnalyzerPlugin({
                            analyzerMode: 'static',
                            defaultSizes: 'gzip',
                            openAnalyzer: CI !== 'true',
                            generateStatsFile: true,
                        }),
                    mode === development && new webpack.NoEmitOnErrorsPlugin(),

                    moduleReplacementPlugin(),

                    // Don't chunk if it's a node target – faster Lambda startup.
                    target === 'node' && new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
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
                                    },
                                },
                            ],
                        },
                        target === 'node' && {
                            test: /\.svg$/,
                            loader: findInProjectThenSDK('svg-sprite-loader'),
                        },
                        target === 'web' && {
                            test: /\.svg$/,
                            loader: 'ignore-loader',
                        },
                        {
                            test: /\.html$/,
                            exclude: /node_modules/,
                            use: {
                                loader: 'html-loader',
                            },
                        },
                    ].filter(Boolean),
                },
            }
        }

        extend(callback) {
            this.config = callback(this.config)
            return this
        }

        build() {
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
            chunkFilename: '[name].js', // Support chunking with @loadable/components
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        // Anything imported from node_modules lands in
                        // vendor.js, if we're chunking.
                        test: /node_modules/,
                        name: 'vendor',
                        chunks: 'all',
                    },
                },
            },
        },
        performance: {
            maxEntrypointSize: 905000,
            maxAssetSize: 825000,
        },
    }
}

const client = baseConfig('web')
    .extend(withChunking)
    .extend((config) => {
        return {
            ...config,
            name: 'client',
            entry: {
                main: './app/main',
            },
            plugins: [...config.plugins, new LoadablePlugin({writeToDisk: true})],
        }
    })
    .build()

const clientOptional = baseConfig('web')
    .extend((config) => {
        let entry = {}
        const optionals = [
            [resolve(projectDir, 'app', 'loader.js'), {loader: './app/loader.js'}],
            [resolve(projectDir, 'worker', 'main.js'), {worker: './worker/main.js'}],
            [resolve(projectDir, 'node_modules', 'core-js'), {'core-polyfill': 'core-js'}],
            [resolve(projectDir, 'node_modules', 'whatwg-fetch'), {'fetch-polyfill': 'whatwg-fetch'}],
        ]
        optionals.forEach(([path, newEntry]) => {
            if (fs.existsSync(path)) {
                entry = {...entry, ...newEntry}
            }
        })
        return {
            ...config,
            name: 'pwa-others',
            entry,
        }
    })
    .build()

const server = baseConfig('node')
    .extend((config) => {
        return {
            ...config,
            name: 'server',
            entry: 'pwa-kit-react-sdk/ssr/server/react-rendering.js',
            output: {
                path: buildDir,
                filename: 'server-renderer.js',
                libraryTarget: 'commonjs2',
            },
            plugins: [
                ...config.plugins,

                // Keep this on the slowest-to-build item - the server-side bundle.
                new WebpackNotifierPlugin({
                    title: `Mobify Project: ${pkg.name}`,
                    excludeWarnings: true,
                    skipFirstNotification: true,
                }),

                // Must only appear on one config – this one is the only mandatory one.
                new CopyPlugin({
                    patterns: [{from: 'app/static/', to: 'static/'}],
                }),
            ],
        }
    })
    .build()

const requestProcessor = baseConfig('node')
    .extend((config) => {
        let entry = {}
        if (fs.existsSync(resolve(appDir, 'request-processor.js'))) {
            entry = {...entry, 'request-processor': './app/request-processor.js'}
        }
        return {
            ...config,
            name: 'request-processor',
            entry,
        }
    })
    .build()

module.exports = [client, server, clientOptional, requestProcessor]
