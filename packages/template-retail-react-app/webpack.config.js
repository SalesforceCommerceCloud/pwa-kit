/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const config = require('@salesforce/pwa-kit-dev/configs/webpack/config.js')
const configNames = require('@salesforce/pwa-kit-dev/configs/webpack/config-names.js')
const {isRemote} = require('@salesforce/pwa-kit-runtime/utils/ssr-server.js')
const webpack = require('webpack')

module.exports = config.map((configItem) => {
    // Add CSS loader support to ALL configurations to handle CSS files like @adyen/adyen-web/dist/adyen.css
    const updatedConfig = {
        ...configItem,
        module: {
            ...configItem.module,
            rules: [
                // Filter out source-map-loader rules to prevent build failures
                ...(configItem.module?.rules || []).filter((rule) => {
                    if (
                        rule.use &&
                        rule.use.loader &&
                        rule.use.loader.includes('source-map-loader')
                    ) {
                        return false
                    }
                    if (
                        rule.use &&
                        Array.isArray(rule.use) &&
                        rule.use.some((u) => u.loader && u.loader.includes('source-map-loader'))
                    ) {
                        return false
                    }
                    return true
                }),
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },
        resolve: {
            ...configItem.resolve,
            fallback: {
                ...configItem.resolve?.fallback,
                // Node.js built-in module fallbacks for browser builds
                crypto: false,
                worker_threads: false,
                async_hooks: false,
                zlib: false,
                net: false,
                tls: false,
                assert: false,
                fs: false,
                path: false,
                os: false,
                http: false,
                https: false,
                stream: false,
                buffer: false,
                util: false,
                events: false,
                querystring: false,
                url: false,
                process: false
            },
            alias: {
                ...configItem.resolve?.alias,
                // Handle node: protocol imports for Node.js built-ins
                'node:zlib': false,
                'node:net': false,
                'node:tls': false,
                'node:assert': false,
                'node:fs': false,
                'node:path': false,
                'node:os': false,
                'node:http': false,
                'node:https': false,
                'node:stream': false,
                'node:buffer': false,
                'node:util': false,
                'node:events': false,
                'node:querystring': false,
                'node:url': false,
                'node:crypto': false,
                'node:worker_threads': false,
                'node:async_hooks': false
            }
        }
    }

    // Special handling for CLIENT and SERVER configurations
    if (configItem.name === configNames.CLIENT || configItem.name === configNames.SERVER) {
        updatedConfig.devtool = isRemote() || process.env.CI === 'true' ? false : 'source-map'
    }

    // Add plugins to handle node: protocol imports
    if (!updatedConfig.plugins) {
        updatedConfig.plugins = []
    }

    // Add NormalModuleReplacementPlugin to handle node: protocol imports
    updatedConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
            const mod = resource.request.replace(/^node:/, '')
            resource.request = mod
        })
    )

    return updatedConfig
})
