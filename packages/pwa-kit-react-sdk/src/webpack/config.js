/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
import fs from 'fs'
import path from 'path'

import webpack from 'webpack'
import WebpackNotifierPlugin from 'webpack-notifier'
import CopyPlugin from 'copy-webpack-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import LoadablePlugin from '@loadable/webpack-plugin'
import {createModuleReplacementPlugin} from './plugins'

const projectDir = process.cwd()
const sdkDir = path.resolve(path.join(__dirname, '..', '..'))

const {resolve, join} = path

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
const requestProcessorPath = resolve(appDir, 'request-processor.js')

const projectModules = (pkg) => {
    return resolve(projectDir, 'node_modules', pkg)
}

const sdkModules = (pkg) => {
    return resolve(sdkDir, 'node_modules', pkg)
}

const projectThenSDKModules = (pkg) => {
    return fs.existsSync(projectModules(pkg)) ? projectModules(pkg) : sdkModules(pkg)
}

if (modes.indexOf(mode) < 0) {
    throw new Error(`Mode '${mode}' must be one of '${modes.toString()}'`)
}

const replacements = [
    {
        path: join('pwa-kit-react-sdk', 'ssr', 'universal', 'components', '_app-config'),
        newPath: resolve('.', 'app', 'components', '_app-config', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'ssr', 'universal', 'components', '_document'),
        newPath: resolve('.', 'app', 'components', '_document', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'ssr', 'universal', 'components', '_app'),
        newPath: resolve('.', 'app', 'components', '_app', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'ssr', 'universal', 'components', '_error'),
        newPath: resolve('.', 'app', 'components', '_error', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'ssr', 'universal', 'routes'),
        newPath: resolve('.', 'app', 'routes.jsx'),
    },

    // The 'pwa-kit-react-sdk' is developed in a lerna monorepo and the final resovled paths
    // are different (they include a `dist` foler) when developing. Because of this we have
    // and similar yet slightly different set of replacement paths to account for this
    // scenario. NOTE: There is no reliable/clean way to determine if we are developing within
    // the monorepo so this solution, although not optimal, works.
    {
        path: join('pwa-kit-react-sdk', 'dist', 'ssr', 'universal', 'components', '_app-config'),
        newPath: resolve('.', 'app', 'components', '_app-config', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'dist', 'ssr', 'universal', 'components', '_document'),
        newPath: resolve('.', 'app', 'components', '_document', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'dist', 'ssr', 'universal', 'components', '_app'),
        newPath: resolve('.', 'app', 'components', '_app', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'dist', 'ssr', 'universal', 'components', '_error'),
        newPath: resolve('.', 'app', 'components', '_error', 'index.jsx'),
    },
    {
        path: join('pwa-kit-react-sdk', 'dist', 'ssr', 'universal', 'routes'),
        newPath: resolve('.', 'app', 'routes.jsx'),
    },
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
    WEBPACK_PACKAGE_JSON_MOBIFY: `${JSON.stringify(pkg.mobify || {})}`,
    WEBPACK_SSR_ENABLED: pkg.mobify ? `${pkg.mobify.ssrEnabled}` : 'false',
    DEBUG,
    WEBPACK_PAGE_NOT_FOUND_URL: `'${(pkg.mobify || {}).pageNotFoundURL || ''}' `,
    NODE_ENV: `'${process.env.NODE_ENV}'`,
    ['global.GENTLY']: false,
}

const babelLoader = [
    {
        loader: projectThenSDKModules('babel-loader'),
        options: {
            rootMode: 'upward',
        },
    },
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
    excludeAssets: [/.*img\/.*/, /.*svg\/.*/, /.*json\/.*/, /.*static\/.*/],
}

const common = {
    mode,
    // Reduce amount of output in terminal
    stats,
    // Create source maps for all files
    devtool: 'source-map',

    output: {
        publicPath: '',
        path: buildDir,
        filename: '[name].js',
        chunkFilename: '[name].js', // Support chunking with @loadable/components
    },
    // Tell webpack how to find specific modules
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        alias: {
            'babel-runtime': projectThenSDKModules('babel-runtime'),
            '@loadable/component': projectThenSDKModules('@loadable/component'),
            '@loadable/server': projectThenSDKModules('@loadable/server'),
            '@loadable/webpack-plugin': projectThenSDKModules('@loadable/webpack-plugin'),
            'svg-sprite-loader': projectThenSDKModules('svg-sprite-loader'),
            react: projectThenSDKModules('react'),
            'react-router-dom': projectThenSDKModules('react-router-dom'),
            'react-dom': projectThenSDKModules('react-dom'),
            'react-helmet': projectThenSDKModules('react-helmet'),
            bluebird: projectThenSDKModules('bluebird'),
        },
        fallback: {
            crypto: false,
        },
    },

    plugins: [
        new webpack.DefinePlugin(defines),

        new WebpackNotifierPlugin({
            title: `Mobify Project: ${pkg.name}`,
            excludeWarnings: true,
            skipFirstNotification: true,
        }),

        new CopyPlugin({
            patterns: [{from: 'app/static/', to: 'static/'}],
        }),

        analyzeBundle &&
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                defaultSizes: 'gzip',
                openAnalyzer: CI !== 'true',
                generateStatsFile: true,
            }),
        mode === development && new webpack.NoEmitOnErrorsPlugin(),

        moduleReplacementPlugin,
    ].filter((x) => !!x),

    module: {
        rules: [
            {
                test: /\.js(x?)$/,
                exclude: /node_modules/,
                use: babelLoader,
            },
            {
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
        ],
    },
    externals,
}

// The main PWA entry point gets special treatment for chunking
const main = Object.assign({}, common, {
    name: 'client',
    entry: {
        main: './app/main.jsx',
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // Anything imported from node_modules lands in vendor.js
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
    plugins: [...common.plugins, new LoadablePlugin()],
})

const getOptionalEntries = () => {
    const config = Object.assign({}, common, {
        name: 'pwa-others',
        entry: {},
    })
    const optionals = [
        [resolve(projectDir, 'app', 'loader.js'), {loader: './app/loader.js'}],
        [resolve(projectDir, 'worker', 'main.js'), {worker: './worker/main.js'}],
        [resolve(projectDir, 'node_modules', 'core-js'), {'core-polyfill': 'core-js'}],
        [resolve(projectDir, 'node_modules', 'whatwg-fetch'), {'fetch-polyfill': 'whatwg-fetch'}],
    ]
    optionals.forEach(([path, entry]) => {
        if (fs.existsSync(path)) {
            config.entry = {...config.entry, ...entry}
        }
    })
    return config
}

const others = getOptionalEntries()

/**
 * Configuration for the Express app which is run under Node.
 */
const ssrServerConfig = Object.assign(
    {},
    {
        name: 'server',
        mode,
        devtool: 'source-map', // Always use source map, makes debugging the server much easier.
        entry: './app/server-renderer.jsx',
        target: 'node',
        output: {
            path: buildDir,
            filename: 'ssr.js',
            libraryTarget: 'commonjs2',
        },
        resolve: {
            extensions: ['.js', '.jsx', '.json'],
            alias: common.resolve.alias,
        },
        plugins: [
            new webpack.DefinePlugin(defines),
            // Output a single server file for faster Lambda startup
            new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
            moduleReplacementPlugin,
        ],
        externals,
        module: {
            rules: [
                {
                    test: /\.js(x?)$/,
                    exclude: /node_modules/,
                    use: babelLoader,
                },
                {
                    test: /\.svg$/,
                    loader: projectThenSDKModules('svg-sprite-loader'),
                },
            ],
        },
        stats,
    }
)

const requestProcessor = Object.assign(
    {},
    {
        name: 'request-processor',
        entry: './app/request-processor.js',
        target: 'node',
        mode,
        output: {
            path: resolve(process.cwd(), 'build'),
            filename: 'request-processor.js',
            // Output a CommonJS module for use in Node
            libraryTarget: 'commonjs2',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: babelLoader,
                },
            ],
        },
        stats,
    }
)

const entries = [main, ssrServerConfig, others]

if (fs.existsSync(requestProcessorPath)) {
    entries.push(requestProcessor)
}

module.exports = entries
