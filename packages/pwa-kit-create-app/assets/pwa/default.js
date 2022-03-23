/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
exports.template = ({commerceApi, einsteinApi}) => `module.exports = {
    app: {
        url: {
            locale: 'none'
        },
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
                host: '${new URL(commerceApi.instanceUrl).hostname}',
                path: 'ocapi'
            },
            {
                host: 'api.cquotient.com',
                path: 'einstein'
            }
        ]
    }
}`
