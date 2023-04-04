/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import request from 'supertest'
import app from './ssr'

describe('server', () => {
    afterAll(() => app.server.close())
    test('responds with HTML', () => {
        return request(app.server).get('/').expect(200).expect('Content-Type', /html/)
    })
})
