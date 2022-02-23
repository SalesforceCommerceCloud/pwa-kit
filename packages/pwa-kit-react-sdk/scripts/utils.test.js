/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const Utils = require('./utils')

const pkg = require('../package.json')

let realFail
beforeEach(() => {
    realFail = Utils.fail
    Utils.fail = jest.fn()
})

afterEach(() => {
    Utils.fail = realFail
})

test('getRequestHeaders sets the User-Agent header', () => {
    const result = Utils.getRequestHeaders()
    expect(result['User-Agent']).toBe(`progressive-web-sdk#${pkg.version}`)
})

test('getRequestHeaders copies over headers from the passed object', () => {
    const additionalHeaders = {
        Cryptography: 'none',
        Context: 'testing',
        Connections: 'mocked out'
    }

    const result = Utils.getRequestHeaders(additionalHeaders)

    Object.keys(additionalHeaders).forEach((key) => {
        expect(result[key]).toBe(additionalHeaders[key])
    })
})

