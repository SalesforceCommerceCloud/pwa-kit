/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as errors from './errors'

describe('Errors', () => {
    test('HTTP Errors should have a working toString()', () => {
        const status = 400
        const msg = 'This is a bad request'
        const err = new errors.HTTPError(status, msg)
        expect(err.toString()).toEqual(`HTTPError ${status}: ${msg}`)
    })
})
