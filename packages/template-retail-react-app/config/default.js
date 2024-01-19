/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const sites = require('./sites.js')

module.exports = {
    app: {
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true
        },
        defaultSite: 'RefArch',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'global'
        },
        sites,
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: 'bf7fc8bf-3ca9-45f9-9c73-7dbb5dff08b1',
                organizationId: 'f_ecom_bjnl_dev',
                shortCode: 'performance-001',
                siteId: 'RefArch'
            }
        },
        einsteinAPI: {
            host: 'https://staging.ai.salesforce.com',
            einsteinId: 'd27fafa6-8622-400d-97a4-ddf0794943a2',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'bjnl-RefArch',
            isProduction: true
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
        ssrFunctionNodeVersion: '16.x',
        proxyConfigs: [
            {
                host: 'performance-001.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'development-functional38-qa222.demandware.net',
                path: 'ocapi'
            }
        ]
    }
}
