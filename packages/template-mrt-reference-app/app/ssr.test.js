/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const request = require('supertest')

describe('server', () => {
    let originalEnv, app, server
    beforeEach(() => {
        originalEnv = process.env
        process.env = Object.assign({}, process.env, {
            LISTEN_ADDRESS: '',
            BUNDLE_ID: '1',
            DEPLOY_TARGET: 'test',
            EXTERNAL_DOMAIN_NAME: 'test.com',
            MOBIFY_PROPERTY_ID: 'test',
            AWS_LAMBDA_FUNCTION_NAME: 'pretend-to-be-remote'
        })
        const ssr = require('./ssr')
        app = ssr.app
        server = ssr.server
    })
    afterEach(() => {
        process.env = originalEnv
        server.close()
    })
    test.each([
        ['/', 200, 'application/json; charset=utf-8'],
        ['/tls', 200, 'application/json; charset=utf-8'],
        ['/exception', 500, 'text/html; charset=utf-8'],
        ['/env-vars', 200, 'application/json; charset=utf-8']
    ])('Path %p should render correctly', (path, expectedStatus, expectedContentType) => {
        return request(app)
            .get(path)
            .expect(expectedStatus)
            .expect('Content-Type', expectedContentType)
    })
})
