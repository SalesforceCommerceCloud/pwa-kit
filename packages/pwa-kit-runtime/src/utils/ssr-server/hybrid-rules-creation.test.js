/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs'
import {buildHybridRules} from './hybrid-rules-creation'

jest.mock('fs', () => ({readFileSync: jest.fn()}))

const sampleRoutesSource = `
export const routes = [
  { path: '/' },
  { path: '/callback' },
  { path: '/login' },
  { path: '/category/:categoryId' },
  { path: '/product/:productId' },
  { path: '/checkout/confirmation/:orderNo?' },
  { path: '/account/orders/:orderNo' },
  { path: '*' }
]
`

describe('buildHybridRules', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('builds rules from routes.jsx and includes core, multi-site and direct patterns', () => {
        fs.readFileSync.mockReturnValue(sampleRoutesSource)
        const rules = buildHybridRules('/fake/path/routes.jsx')

        // Core rules present
        expect(rules).toEqual(
            expect.arrayContaining([
                'http.request.uri.path eq "/"',
                'http.request.uri.path matches "^/callback"',
                'http.request.uri.path matches "^/mobify"',
                'http.request.uri.path matches "^/worker.js"',
                'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/$"'
            ])
        )

        // Generated rules for static route
        expect(rules).toEqual(
            expect.arrayContaining([
                'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/login"',
                'http.request.uri.path matches "^/login"'
            ])
        )

        // Generated rules for hyphenated params
        expect(rules).toEqual(
            expect.arrayContaining([
                'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/category/([-\\w]+)"',
                'http.request.uri.path matches "^/category/([-\\w]+)"',
                'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/product/([-\\w]+)"',
                'http.request.uri.path matches "^/product/([-\\w]+)"'
            ])
        )
        // Optional param handled
        expect(rules).toEqual(
            expect.arrayContaining([
                'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/checkout/confirmation/(?:/([-\\w]+))?"',
                'http.request.uri.path matches "^/checkout/confirmation/(?:/([-\\w]+))?"'
            ])
        )

        // Safety nets
        expect(rules).toEqual(
            expect.arrayContaining([
                'http.request.uri.path contains "/category/"',
                'http.request.uri.path contains "/product/"'
            ])
        )
    })
    it('dedupes duplicate routes', () => {
        fs.readFileSync.mockReturnValue(sampleRoutesSource + `\n{ path: '/login' }\n`)
        const rules = buildHybridRules('/fake/path/routes.jsx')
        const loginDirect = 'http.request.uri.path matches "^/login"'
        const count = rules.filter((r) => r === loginDirect).length
        expect(count).toBe(1)
    })

    it('falls back gracefully when file cannot be read', () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error('ENOENT')
        })
        const rules = buildHybridRules('/does/not/exist')
        // Only core + safety nets present
        expect(rules).toEqual(
            expect.arrayContaining([
                'http.request.uri.path eq "/"',
                'http.request.uri.path matches "^/callback"',
                'http.request.uri.path matches "^/mobify"',
                'http.request.uri.path matches "^/worker.js"',
                'http.request.uri.path matches "^/(\\w+)/([-\\w]+)/$"',
                'http.request.uri.path contains "/category/"',
                'http.request.uri.path contains "/product/"'
            ])
        )
    })
})
