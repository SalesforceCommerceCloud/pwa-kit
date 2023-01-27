/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const request = require('supertest')
const app = require('./ssr')

describe('server', () => {
    afterAll(() => app.server.close())
    test('responds with HTML', () => {
        return request(app.server)
            .get('/')
            .expect(200)
            .expect('Content-Type', /html/)
    })
})
