/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
import path, {resolve} from 'path'
import fse from 'fs-extra'

import webpack from 'webpack'
import WebpackNotifierPlugin from 'webpack-notifier'
import CopyPlugin from 'copy-webpack-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import LoadablePlugin from '@loadable/webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin'

import OverridesResolverPlugin from './overrides-plugin'
import {sdkReplacementPlugin} from './plugins'
import {CLIENT, SERVER, CLIENT_OPTIONAL, SSR, REQUEST_PROCESSOR} from './config-names'

const projectDir = process.cwd()
const pkg = fse.readJsonSync(resolve(projectDir, 'package.json'))
const buildDir = process.env.PWA_KIT_BUILD_DIR
    ? resolve(process.env.PWA_KIT_BUILD_DIR)
    : resolve(projectDir, 'build')

const production = 'production'
const development = 'development'
const analyzeBundle = process.env.MOBIFY_ANALYZE === 'true'
const mode = process.env.NODE_ENV === production ? production : development
const INSPECT = process.execArgv.some((arg) => /^--inspect(?:-brk)?(?:$|=)/.test(arg))
const DEBUG = mode !== production && process.env.DEBUG === 'true'
const CI = process.env.CI
const disableHMR = process.env.HMR === 'false'

if ([production, development].indexOf(mode) < 0) {
    throw new Error(`Invalid mode "${mode}"`)
}

// for API convenience, add the leading slash if missing
export const EXT_OVERRIDES_DIR =
    typeof pkg?.ccExtensibility?.overridesDir === 'string' &&
    !pkg?.ccExtensibility?.overridesDir?.match(/(^\/|^\\)/)
        ? '/' + pkg?.ccExtensibility?.overridesDir?.replace(/\\/g, '/')
        : pkg?.ccExtensibility?.overridesDir
        ? pkg?.ccExtensibility?.overridesDir?.replace(/\\/g, '/')
        : ''
export const EXT_OVERRIDES_DIR_NO_SLASH = EXT_OVERRIDES_DIR?.replace(/^\//, '')
export const EXT_EXTENDS = pkg?.ccExtensibility?.extends
export const EXT_EXTENDS_WIN = pkg?.ccExtensibility?.extends?.replace('/', '\\')
export const EXT_EXTENDABLE = pkg?.ccExtensibility?.extendable

// TODO: can these be handled in package.json as peerDependencies?
// https://salesforce-internal.slack.com/archives/C0DKK1FJS/p1672939909212589

// due to to how the sdks work and the potential of these npm deps coming
// from multiple places, we need to force them to one place where they're found
export const DEPS_TO_DEDUPE = [
    'babel-runtime',
    '@tanstack/react-query',
    '@loadable/component',
    '@loadable/server',
    '@loadable/webpack-plugin',
    'svg-sprite-loader',
    'react',
    'react-router-dom',
    'react-dom',
    'react-helmet',
    'webpack-hot-middleware',
    'react-intl',
    '@chakra-ui/icons',
    '@chakra-ui/react',
    '@chakra-ui/skip-nav',
    '@emotion/react'
]

if (EXT_EXTENDABLE && EXT_EXTENDS) {
    const extendsAsArr = Array.isArray(EXT_EXTENDS) ? EXT_EXTENDS : [EXT_EXTENDS]
    const conflicts = extendsAsArr.filter((x) => EXT_EXTENDABLE?.includes(x))
    if (conflicts?.length) {
        throw new Error(
            `Dependencies in 'extendable' and 'extends' cannot overlap, fix these: ${conflicts.join(
                ', '
            )}"`
        )
    }
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
        const primary = resolve(projectDir, ...segments) + ext
        const override = EXT_OVERRIDES_DIR
            ? resolve(projectDir, EXT_OVERRIDES_DIR_NO_SLASH, ...segments) + ext
            : null

        if (fse.existsSync(primary) || (override && fse.existsSync(override))) {
            return true
        }
    }
    return false
}

const getAppEntryPoint = () => {
    return resolve('./', EXT_OVERRIDES_DIR_NO_SLASH, 'app', 'main')
}

const getPublicPathEntryPoint = () => {
    return resolve(
        projectDir,
        'node_modules',
        '@salesforce',
        'pwa-kit-dev',
        'ssr',
        'server',
        'public-path'
    )
}

const findDepInStack = (pkg) => {
    // Look for the SDK node_modules in two places because in CI,
    // pwa-kit-dev is published under a 'dist' directory, which
    // changes this file's location relative to the package root.
    const candidates = [
        resolve(projectDir, 'node_modules', pkg),
        resolve(__dirname, '..', '..', 'node_modules', pkg),
        resolve(__dirname, '..', '..', '..', 'node_modules', pkg)
    ]
    let candidate
    for (candidate of candidates) {
        if (fse.existsSync(candidate)) {
            return candidate
        }
    }
    return candidate
}

const baseConfig = (target) => {
    if (!['web', 'node'].includes(target)) {
        throw Error(`The value "${target}" is not a supported webpack target`)
    }
    class Builder {
        constructor() {
            this.config = {
                watchOptions: {
                    aggregateTimeout: 1000
                },
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
                    ...(EXT_EXTENDS && EXT_OVERRIDES_DIR
                        ? {
                              plugins: [
                                  new OverridesResolverPlugin({
                                      extends: [EXT_EXTENDS],
                                      overridesDir: EXT_OVERRIDES_DIR,
                                      projectDir: process.cwd()
                                  })
                              ]
                          }
                        : {}),
                    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
                    alias: {
                        ...Object.assign(
                            ...DEPS_TO_DEDUPE.map((dep) => ({
                                [dep]: findDepInStack(dep)
                            }))
                        ),
                        ...(EXT_OVERRIDES_DIR && EXT_EXTENDS
                            ? Object.assign(
                                  // NOTE: when an array of `extends` dirs are accepted, don't coerce here
                                  ...[EXT_EXTENDS].map((extendTarget) => ({
                                      [extendTarget]: path.resolve(
                                          projectDir,
                                          'node_modules',
                                          ...extendTarget.split('/')
                                      )
                                  }))
                              )
                            : {}),
                        ...(EXT_EXTENDABLE
                            ? Object.assign(
                                  ...[EXT_EXTENDABLE].map((item) => ({
                                      [item]: path.resolve(projectDir)
                                  }))
                              )
                            : {})
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

                    sdkReplacementPlugin(),

                    // Don't chunk if it's a node target – faster Lambda startup.
                    target === 'node' && new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1})
                ].filter(Boolean),

                module: {
                    rules: [
                        ruleForBabelLoader(),
                        target === 'node' && {
                            test: /\.svg$/,
                            loader: findDepInStack('svg-sprite-loader')
                        },
                        target === 'web' && {
                            test: /\.svg$/,
                            loader: findDepInStack('ignore-loader')
                        },
                        {
                            test: /\.html$/,
                            exclude: /node_modules/,
                            use: {
                                loader: findDepInStack('html-loader')
                            }
                        },
                        {
                            test: /\.js$/,
                            enforce: 'pre',
                            use: {
                                loader: findDepInStack('source-map-loader')
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
                        // Three scenarios that we'd like to chunk vendor.js:
                        // 1. The package is in node_modules
                        // 2. The package is one of the monorepo packages.
                        //    This is for local development to ensure the bundle
                        //    composition is the same as a production build
                        // 3. If extending another template, don't include the
                        //    baseline route files in vendor.js
                        test: (module) => {
                            if (
                                EXT_EXTENDS &&
                                EXT_OVERRIDES_DIR &&
                                module?.context?.includes(
                                    `${path.sep}${
                                        path.sep === '/' ? EXT_EXTENDS : EXT_EXTENDS_WIN
                                    }${path.sep}`
                                )
                            ) {
                                return false
                            }
                            return module?.context?.match?.(/(node_modules)|(packages\/(.*)dist)/)
                        },
                        name: 'vendor',
                        chunks: 'all'
                    }
                }
            }
        }
    }
}

const staticFolderCopyPlugin = new CopyPlugin({
    patterns: [
        {
            from: path
                .resolve(`${EXT_OVERRIDES_DIR ? EXT_OVERRIDES_DIR_NO_SLASH + '/' : ''}app/static`)
                .replace(/\\/g, '/'),
            to: `static/`,
            noErrorOnMissing: true
        }
    ]
})

const ruleForBabelLoader = (babelPlugins) => {
    return {
        id: 'babel-loader',
        test: /(\.js(x?)|\.ts(x?))$/,
        ...(EXT_OVERRIDES_DIR && EXT_EXTENDS
            ? // TODO: handle for array here when that's supported
              {
                  exclude: new RegExp(
                      `${path.sep}node_modules(?!${path.sep}${
                          path.sep === '/' ? EXT_EXTENDS : EXT_EXTENDS_WIN
                      })`
                  )
              }
            : {exclude: /node_modules/}),
        use: [
            {
                loader: findDepInStack('babel-loader'),
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
            main: [
                'webpack-hot-middleware/client?path=/__mrt/hmr',
                getPublicPathEntryPoint(),
                getAppEntryPoint()
            ]
        },
        plugins: [
            ...config.plugins,

            new webpack.HotModuleReplacementPlugin(),
            new ReactRefreshWebpackPlugin({
                overlay: false
            })
        ]
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
                    main: getAppEntryPoint()
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
    return fse.existsSync(path) ? {[name]: path} : {}
}

const clientOptional = baseConfig('web')
    .extend((config) => {
        return {
            ...config,
            name: CLIENT_OPTIONAL,
            entry: {
                ...optional('loader', resolve(projectDir, EXT_OVERRIDES_DIR, 'app', 'loader.js')),
                ...optional('worker', resolve(projectDir, 'worker', 'main.js')),
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
    fse.existsSync(resolve(projectDir, 'node_modules', '@salesforce', 'pwa-kit-react-sdk')) &&
    baseConfig('node')
        .extend((config) => {
            return {
                ...config,
                // Must be named "server". See - https://www.npmjs.com/package/webpack-hot-server-middleware#usage
                name: SERVER,
                entry: '@salesforce/pwa-kit-react-sdk/ssr/server/react-rendering.js',
                // use eval-source-map for server-side debugging
                devtool: mode === development && INSPECT ? 'eval-source-map' : false,
                output: {
                    path: buildDir,

                    // We want to split the build on local development to reduce memory usage.
                    // It is required to have a single entry point for the remote server.
                    // See pwa-kit-runtime/ssr/server/build-remote-server.js render method.
                    filename: mode === development ? '[name]-server.js' : 'server-renderer.js',
                    libraryTarget: 'commonjs2'
                },
                plugins: [
                    ...config.plugins,
                    staticFolderCopyPlugin,
                    // Keep this on the slowest-to-build item - the server-side bundle.
                    new WebpackNotifierPlugin({
                        title: `PWA Kit Project: ${pkg.name}`,
                        excludeWarnings: true,
                        skipFirstNotification: true
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
                    ...(process.env.PWA_KIT_SSR_SOURCE_MAP === 'true'
                        ? {devtool: 'source-map'}
                        : {}),
                    // Must *not* be named "server". See - https://www.npmjs.com/package/webpack-hot-server-middleware#usage
                    name: SSR,
                    entry: `.${EXT_OVERRIDES_DIR}/app/ssr.js`,
                    output: {
                        path: buildDir,
                        filename: 'ssr.js',
                        libraryTarget: 'commonjs2'
                    },
                    plugins: [
                        ...config.plugins,
                        staticFolderCopyPlugin,
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
                // entry: './app/request-processor.js',
                entry: `.${EXT_OVERRIDES_DIR}/app/request-processor.js`,
                output: {
                    path: buildDir,
                    filename: 'request-processor.js',
                    libraryTarget: 'commonjs2'
                },
                // use eval-source-map for server-side debugging
                devtool: mode === development && INSPECT ? 'eval-source-map' : false,
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
