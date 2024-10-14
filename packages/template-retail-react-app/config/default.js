/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sites = require('./sites.js')

module.exports = {
    app: {
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true,
            interpretPlusSignAsSpace: false
        },
        defaultSite: 'RefArch',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'int'
        },
        sites,
        commerceAPI: {
            refreshTokenTTL: 180, // 0 seconds, the minimum
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: '3872b78d-3fb1-4885-8e8e-10481da37780',
                organizationId: 'f_ecom_zzcu_289',
                shortCode: 'kv7kzm78',
                siteId: 'RefArch'
            }
        },
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst',
            isProduction: false
        }
    },
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
        ssrFunctionNodeVersion: '20.x',
        proxyConfigs: [
            {
                host: 'kv7kzm78.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'zzcu-289.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            }
        ]
    }
}
