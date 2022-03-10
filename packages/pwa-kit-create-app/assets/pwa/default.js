/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
exports.template = ({commerceApi, einsteinApi}) => `module.exports = {
    app: {
        "url": {
            // "site": "none",
            "locale": "none",
            // a flag to toggle display default values (either site and locale) to display in the url
            // if they are set to be in path or query_param 
            // "showDefaults": false 
        },
        "defaultSite": "RefArch",
        // "siteAliases": {
        // adding alias to your site if it is displayed in the url
        //     "RefArch": "us" 
        // },
        "sites": [
            {
                "id": "RefArch",
                "l10n": {
                    "supportedCurrencies": ["USD"],
                    "defaultCurrency": "USD",
                    "defaultLocale": "en-US",
                    "supportedLocales": [
                        {
                            "id": "en-US",
                            "preferredCurrency": "USD"
                        }
                    ]
                }
            }
        ],
        commerceAPI: {
            proxyPath: \`/mobify/proxy/${commerceApi.proxyPath}\`,
            parameters: {
                clientId: '${commerceApi.clientId}',
                organizationId: '${commerceApi.organizationId}',
                shortCode: '${commerceApi.shortCode}',
                siteId: '${commerceApi.siteId}'
            }
        },
        einsteinAPI: {
            proxyPath: \`/mobify/proxy/${einsteinApi.proxyPath}\`,
            einsteinId: '${einsteinApi.einsteinId}',
            siteId: '${einsteinApi.siteId}'
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
                host: 'api.cquotien.com',
                path: 'einstein'
            }
        ]
    }
}`
