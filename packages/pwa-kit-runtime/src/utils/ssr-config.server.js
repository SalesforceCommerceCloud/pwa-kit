/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const getConfig = () => {
    console.log('EXECUTING SERVER IMPLEMENTATION')
    console.log('__dirname: ', __dirname)
    const isRemote = Object.prototype.hasOwnProperty.call(process.env, 'AWS_LAMBDA_FUNCTION_NAME')
    let moduleName = process?.env?.DEPLOY_TARGET || ''

    const {cosmiconfigSync} = require('cosmiconfig')

    // Match config files based on the specificity from most to most general.
    const explorerSync = cosmiconfigSync(moduleName, {
        packageProp: 'mobify',
        searchPlaces: [
            `config/${moduleName}.js`,
            `config/${moduleName}.yml`,
            `config/${moduleName}.yaml`,
            `config/${moduleName}.json`,
            `config/local.js`,
            `config/local.yml`,
            `config/local.yaml`,
            `config/local.json`,
            `config/default.js`,
            `config/default.yml`,
            `config/default.yaml`,
            `config/default.json`,
            `package.json`
        ].map((path) => (isRemote ? `build/${path}` : path))
    })

    // Load the config synchronously using a custom "searchPlaces".
    const {config} = explorerSync.search() || {}

    if (!config) {
        throw new Error('Application configuration not found!')
    }
    // const config = {
    //     app: {
    //         url: {
    //             locale: 'path'
    //         }
    //     },
    //     externals: [],
    //     pageNotFoundURL: '/page-not-found',
    //     ssrEnabled: true,
    //     ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    //     ssrShared: [
    //         'static/ico/favicon.ico',
    //         'static/robots.txt',
    //         '**/*.js',
    //         '**/*.js.map',
    //         '**/*.json'
    //     ],
    //     ssrParameters: {
    //         ssrFunctionNodeVersion: '14.x',
    //         proxyConfigs: [
    //             {
    //                 host: 'kv7kzm78.api.commercecloud.salesforce.com',
    //                 path: 'api'
    //             },
    //             {
    //                 host: 'zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
    //                 path: 'ocapi'
    //             },
    //             {
    //                 host: 'api.cquotien.com',
    //                 path: 'einstein'
    //             }
    //         ]
    //     }
    // }
    console.log('config = ', config)
    return config
}