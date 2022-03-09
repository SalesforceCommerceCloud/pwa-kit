/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    app: {
        url: {
            locale: 'path'
        },
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: '50b359ea-4224-4125-b75d-dd80ff4b0f00',
                organizationId: 'f_ecom_bdpx_dev',
                shortCode: 'xitgmcd3',
                siteId: 'RefArch'
            }
        },
        einsteinAPI: {
            proxyPath: `/mobify/proxy/einstein`,
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst'
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
                host: 'xitgmcd3.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'development-internal-ccdemo.demandware.net',
                path: 'ocapi'
            },
            {
                host: 'api.cquotien.com',
                path: 'einstein'
            }
        ]
    }
}
