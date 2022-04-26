/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import routes from './routes'

describe('Routes', () => {
    test('exports a valid react-router configuration', () => {
        expect(Array.isArray(routes) || typeof routes === 'function').toBe(true)
    })
})
