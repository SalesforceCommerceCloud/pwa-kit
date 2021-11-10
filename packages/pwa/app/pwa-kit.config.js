/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import Config from 'pwa-kit-react-sdk/config'

// The Config class automatically validate the config object.
// Error will be thrown if configuration object is invalid.
export default new Config({
    version: '1.0.0',
    app: {
        commerceApi: {
            clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
            organizationId: 'f_ecom_zzrf_001',
            shortCode: '8o7m175y',
            siteId: 'RefArchGlobal'
        },
        einsteinApi: {
            clientId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            siteId: 'aaij-MobileFirst'
        }
    },
    server: {
        // The build directory (an absolute path)
        buildDir: path.resolve(process.cwd(), 'build'),

        // The cache time for SSR'd pages (defaults to 600 seconds)
        defaultCacheTimeSeconds: 600,

        // The path to the favicon. This must also appear in
        // the mobify.ssrShared section of package.json.
        faviconPath: path.resolve(process.cwd(), 'build/static/ico/favicon.ico'),

        // The location of the apps manifest file relative to the build directory
        manifestPath: 'static/manifest.json',

        mobify: {
            externals: [],
            pageNotFoundURL: '/page-not-found',
            ssrEnabled: true,
            ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
            ssrShared: [
                'static/ico/favicon.ico',
                'static/robots.txt',
                '**/*.js',
                '**/*.js.map',
                '**/*.json'
            ],
            ssrParameters: {
                ssrFunctionNodeVersion: '14.x',
                proxyConfigs: [
                    {
                        host: 'kv7kzm78.api.commercecloud.salesforce.com',
                        path: 'api'
                    },
                    {
                        host: 'zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
                        path: 'ocapi'
                    },
                    {
                        host: 'api.cquotient.com',
                        path: 'einstein'
                    }
                ]
            }
        },

        // The port that the local dev server listens on
        port: 3000,

        // The protocol on which the development Express app listens.
        // Note that http://localhost is treated as a secure context for development.
        protocol: 'http'
    }
})
