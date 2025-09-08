/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// Custom webpack configuration for template-mrt-reference-app
// This extends the default PWA Kit configuration to handle ES modules for ssr.mjs

const path = require('path')
const fse = require('fs-extra')

// Import the default PWA Kit webpack configuration
const defaultConfig = require('@salesforce/pwa-kit-dev/configs/webpack/config')

const projectDir = process.cwd()
const pkg = fse.readJsonSync(path.resolve(projectDir, 'package.json'))
const buildDir = process.env.PWA_KIT_BUILD_DIR
    ? path.resolve(process.env.PWA_KIT_BUILD_DIR)
    : path.resolve(projectDir, 'build')

const production = 'production'
const development = 'development'
const mode = process.env.NODE_ENV === production ? production : development

// Helper function to check if entry point exists with different extensions
const entryPointExists = (segments) => {
    for (let ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
        const entryPath = path.resolve(projectDir, ...segments) + ext
        if (fse.existsSync(entryPath)) {
            return entryPath
        }
    }
    return null
}

// Create custom SSR configuration for ES modules
const createESModuleSSRConfig = () => {
    if (mode !== production) {
        return null
    }

    const ssrEntryPath = entryPointExists(['app', 'ssr'])
    if (!ssrEntryPath) {
        return null
    }

    return {
        mode,
        target: 'node',
        name: 'ssr-esm',
        entry: ssrEntryPath,
        output: {
            path: buildDir,
            filename: 'ssr.mjs',
            // Use ES module format instead of CommonJS
            library: {
                type: 'module'
            },
            environment: {
                module: true
            },
            chunkFormat: 'module'
        },
        experiments: {
            // Enable ES module support
            outputModule: true
        },
        resolve: {
            extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
            // Prefer ES modules when available
            mainFields: ['module', 'main'],
            // Allow importing without file extensions in ES modules
            fullySpecified: false
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    resolve: {
                        fullySpecified: false
                    }
                },
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: {
                                            node: '18'
                                        },
                                        modules: false // Keep ES modules
                                    }
                                ]
                            ]
                        }
                    }
                }
            ]
        },
        externals: [
            // Don't bundle Node.js built-in modules
            require('webpack-node-externals')()
        ],
        optimization: {
            minimize: mode === production
        },
        devtool: process.env.PWA_KIT_SOURCE_MAP === 'true' ? 'source-map' : false,
        stats: {
            all: false,
            modules: false,
            errors: true,
            warnings: true,
            moduleTrace: true,
            errorDetails: true,
            colors: true
        }
    }
}

// Get the default configurations and add our custom ESM SSR config
const configs = Array.isArray(defaultConfig) ? defaultConfig : [defaultConfig]

// Filter out the default SSR config and add our custom one
const filteredConfigs = configs.filter(config => config && config.name !== 'ssr')
const customSSRConfig = createESModuleSSRConfig()

if (customSSRConfig) {
    filteredConfigs.push(customSSRConfig)
}

module.exports = filteredConfigs.filter(Boolean)
