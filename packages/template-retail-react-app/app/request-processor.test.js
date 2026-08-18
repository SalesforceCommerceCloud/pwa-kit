/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {processRequest} from '@salesforce/retail-react-app/app/request-processor'

describe('processRequest', () => {
    test('returns valid values', () => {
        const result = processRequest({path: 'path', querystring: 'querystring'})

        expect(result.path).toEqual(expect.any(String))
        expect(result.querystring).toEqual(expect.any(String))
    })

    test('SLAS callback parameters are removed', () => {
        const result = processRequest({path: '/callback', querystring: 'usid=1&code=2&test=3'})

        expect(result.path).toBe('/callback')
        expect(result.querystring).toBe('test=3')
    })

    test('trusted agent callback keeps code when state is present', () => {
        // The Trusted Agent (Order on Behalf) redirect carries both code and state.
        // code must survive so the rendered callback page can deliver it to the
        // opener; usid is still stripped.
        const result = processRequest({
            path: '/callback',
            querystring: 'usid=1&code=2&state=abc'
        })

        expect(result.path).toBe('/callback')
        expect(result.querystring).toBe('code=2&state=abc')
    })

    test('standard callback still strips code when no state is present', () => {
        const result = processRequest({path: '/callback', querystring: 'usid=1&code=2'})

        expect(result.path).toBe('/callback')
        expect(result.querystring).toBe('')
    })

    test('empty state is treated as a standard callback and strips code', () => {
        // An empty `state=` is not a real trusted agent callback. Match on a truthy
        // value so this stays aligned with handleCallback's `code && state` guard: the
        // one-time code must be stripped so a code-bearing URL is never year-cacheable.
        // The empty `state=` itself is harmless and left as-is.
        const result = processRequest({path: '/callback', querystring: 'usid=1&code=2&state='})

        expect(result.path).toBe('/callback')
        expect(result.querystring).toBe('state=')
    })
})
