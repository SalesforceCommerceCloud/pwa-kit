/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import {resolve} from 'path'
import fse from 'fs-extra'
import webpack from 'webpack'

// Third-Party Plugins
import CopyPlugin from 'copy-webpack-plugin'
import LoadablePlugin from '@loadable/webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin'
import WebpackNotifierPlugin from 'webpack-notifier'

// Local Plugins
import OverridesResolverPlugin from './plugins/overrides-resolver-plugin'
import {sdkReplacementPlugin} from './plugins'

// Constants
import {CLIENT, SERVER, CLIENT_OPTIONAL, SSR, REQUEST_PROCESSOR} from './config-names'

// Utilities
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {buildAliases, getExtensionNames, nameRegex} from '../../utils/extensibility-utils'

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

const {app: appConfig} = getConfig()

if ([production, development].indexOf(mode) < 0) {
    throw new Error(`Invalid mode "${mode}"`)
}

export const SUPPORTED_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

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
        if (fse.existsSync(p)) {
            return true
        }
    }
    return false
}

const getAppEntryPoint = () => './app/main'

const getServerEntryPoint = () => './app/ssr.js'

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
                    plugins: [
                        new OverridesResolverPlugin({
                            projectDir: process.cwd(),
                            extensions: appConfig?.extensions,
                            fileExtensions: SUPPORTED_FILE_EXTENSIONS
                        })
                    ],
                    extensions: SUPPORTED_FILE_EXTENSIONS,
                    alias: {
                        // Create alias's for "all" extensions, enabled or disabled, as they as they are being imported from the SDK package
                        // and cannot be resolved from that location. We create alias's for all because we do not know which extensions
                        // are configured at build time.
                        ...buildAliases(
                            Object.keys(pkg?.devDependencies || {}).filter((dependency) =>
                                dependency.match(nameRegex)
                            )
                        ),
                        ...Object.assign(
                            ...DEPS_TO_DEDUPE.map((dep) => ({
                                [dep]: findDepInStack(dep)
                            }))
                        )
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
                        },
                        {
                            test: /universal\/extensibility\/extensions/,
                            loader: `@salesforce/pwa-kit-dev/configs/webpack/loaders/extensions-loader`,
                            options: {
                                pkg
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
                        test: /(node_modules)|(packages\/.*\/dist)/,
                        name: 'vendor',
                        chunks: 'all'
                    }
                }
            }
        }
    }
}

const staticFolderCopyPlugin = new CopyPlugin({
    patterns: [{from: 'app/static/', to: 'static/'}]
})

const ruleForBabelLoader = (babelPlugins) => {
    return {
        id: 'babel-loader',
        test: /(\.js(x?)|\.ts(x?))$/,
        // NOTE: Because our extensions are just folders containing source code, we need to ensure that the babel-loader processes them.
        // By default babel doesn't process files in "node_modules" folder, so here we will ensure they are included.
        // TODO: Make sure this regex works for windows.
        exclude: /^\/node_modules\/(?:@([^/]+)\/)*(?!extension-)[^/]+$/i,
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
                ...optional('loader', resolve(projectDir, 'app', 'loader.js')),
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
                    entry: getServerEntryPoint(),
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
                entry: './app/request-processor.js',
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

// This is the extensions for multi-extensibility feature in PWA Kit.
// Don't mistake this with the concept of extensions for Webpack.
const extensions =
    mode === 'production'
        ? (getExtensionNames(appConfig?.extensions) || [])
              .map((extension) => {
                  const setupServerFilePathBase = `${projectDir}/node_modules/${extension}/src/setup-server`
                  const foundType = ['ts', 'js'].find((type) =>
                      fse.existsSync(`${setupServerFilePathBase}.${type}`)
                  )

                  if (!foundType) {
                      // No setup-server file found, early exit because it's optional
                      return
                  }

                  const defaultTsConfig = {
                      target: 'ES2020',
                      module: 'commonjs',
                      strict: true,
                      esModuleInterop: true,
                      skipLibCheck: true
                  }

                  let tsConfigFound = fse.existsSync(
                      `${projectDir}/node_modules/${extension}/tsconfig.json`
                  )

                  return {
                      name: 'extensions',
                      target: 'node',
                      mode,
                      entry: setupServerFilePathBase,
                      output: {
                          path: `${buildDir}/extensions/${extension}`,
                          filename: 'setup-server.js',
                          libraryTarget: 'commonjs2'
                      },
                      resolve: {
                          extensions: ['.ts', '.js']
                      },
                      module: {
                          rules: [
                              {
                                  test: /\.ts?$/,
                                  use: {
                                      loader: findDepInStack('ts-loader'),
                                      options: {
                                          // If tsconfig is not found, ignore tsconfig.json and rely on
                                          // using the default compilerOptions
                                          // TODO: Avoid using happyPackMode in the future.
                                          // This was required to get your PR working because the `tsconfig.json`
                                          // file was not found.
                                          happyPackMode: !tsConfigFound,
                                          compilerOptions: tsConfigFound ? {} : defaultTsConfig
                                      }
                                  },
                                  exclude: /node_modules/
                              }
                          ]
                      },
                      optimization: {
                          minimize: false
                      }
                  }
              })
              .filter(Boolean)
        : []

module.exports = [client, ssr, renderer, clientOptional, requestProcessor, ...extensions]
    .filter(Boolean)
    .map((config) => {
        return new SpeedMeasurePlugin({disable: !process.env.MEASURE}).wrap(config)
    })
