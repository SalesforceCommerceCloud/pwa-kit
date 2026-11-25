/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {defineConfig, devices} = require('@playwright/test')

const origin = 'http://127.0.0.1:4177'

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: '*.widget.js',
    forbidOnly: Boolean(process.env.CI),
    retries: 0,
    workers: 2,
    reporter: [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
    outputDir: 'test-results',
    use: {
        baseURL: origin,
        serviceWorkers: 'block',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    projects: [
        {name: 'desktop', use: {...devices['Desktop Chrome'], browserName: 'chromium'}},
        {name: 'mobile', use: {...devices['Pixel 5'], browserName: 'chromium'}}
    ],
    webServer: {
        command: 'node e2e/widget/server.mjs',
        cwd: require('node:path').resolve(__dirname, '../..'),
        url: origin,
        timeout: 120000
    }
})
