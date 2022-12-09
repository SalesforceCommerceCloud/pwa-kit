/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
exports.template = ({commerceApi, einsteinApi}) => `const sites = require('./sites.js')
module.exports = {
    app: {
        // Customize how your 'site' and 'locale' are displayed in the url.
        url: {
            // Determine where the siteRef is located. Valid values include 'path|query_param|none'. Defaults to: 'none'
            // site: 'none',
            // Determine where the localeRef is located. Valid values include 'path|query_param|none'. Defaults to: 'none'
            locale: 'none',
            // This boolean value dictates whether or not default site or locale values are shown in the url. Defaults to: false
            // showDefaults: true
        },
        // The default site for your app. This value will be used when a siteRef could not be determined from the url
        defaultSite: '${commerceApi.siteId}',
        // Provide aliases for your sites. These will be used in place of your site id when generating paths throughout the application.
        // siteAliases: {
        //     RefArch: 'us'
        // },
        // The sites for your app, which is imported from sites.js
        sites,
        // Commerce api config
        commerceAPI: {
            proxyPath: \`/mobify/proxy/${commerceApi.proxyPath}\`,
            parameters: {
                clientId: '${commerceApi.clientId}',
                organizationId: '${commerceApi.organizationId}',
                shortCode: '${commerceApi.shortCode}',
                siteId: '${commerceApi.siteId}'
            }
        },
        // Einstein api config
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '${einsteinApi.einsteinId}',
            siteId: '${einsteinApi.siteId}'
        }
    },
    // This list contains server-side only libraries that you don't want to be compiled by webpack
    externals: [],
    // Page not found url for your app
    pageNotFoundURL: '/page-not-found',
    // Enables or disables building the files necessary for server-side rendering.
    ssrEnabled: true,
    // This list determines which files are available exclusively to the server-side rendering system 
    // and are not available through the /mobify/bundle/ path.
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    // This list determines which files are available to the server-side rendering system 
    // and available through the /mobify/bundle/ path.
    ssrShared: [
        'static/ico/favicon.ico',
        'static/robots.txt',
        '**/*.js',
        '**/*.js.map',
        '**/*.json'
    ],
    // Additional parameters that configure Express app behavior.
    ssrParameters: {
        ssrFunctionNodeVersion: '14.x',
        proxyConfigs: [
            {
                host: '${commerceApi.shortCode}.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: '${new URL(commerceApi.instanceUrl).hostname}',
                path: 'ocapi'
            }
        ]
    }
}`
