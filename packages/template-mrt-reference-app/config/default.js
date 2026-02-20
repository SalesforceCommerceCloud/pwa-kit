/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    envBasePath: '/',
    ssrEnabled: true,
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    ssrShared: [
        'static/example.json',
        'static/example.txt',
        'static/favicon.ico',
        'static/robots.txt',
        'config/default.js'
    ],
    ssrParameters: {
        ssrFunctionNodeVersion: '24.x',
        proxyConfigs: [
            {
                host: 'httpbin.org',
                path: 'httpbin'
            }
        ]
    }
}
