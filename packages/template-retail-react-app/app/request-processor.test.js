/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {processRequest} from './request-processor'

describe('processRequest', () => {
    test('returns valid values', () => {
        const result = processRequest({path: 'path', querystring: 'querystring'})

        expect(result.path).toEqual(expect.any(String))
        expect(result.querystring).toEqual(expect.any(String))
    })
})
