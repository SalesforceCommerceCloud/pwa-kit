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
                clientId: 'cdbc4a96-8d95-447c-ac1e-226aed007c98',
                organizationId: 'f_ecom_bjnl_dev',
                shortCode: 'sandbox-001',
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
                host: 'sandbox-001.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'development-functional38-qa222.demandware.net',
                path: 'ocapi'
            }
        ]
    }
}
