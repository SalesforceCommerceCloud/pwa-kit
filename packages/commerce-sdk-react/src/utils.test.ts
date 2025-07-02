/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DehydratedState} from '@tanstack/react-query'
import * as utils from './utils'

describe('resetDehydratedStateTimeStamp', () => {
    const mockDehydratedState: DehydratedState = {
        mutations: [],
        queries: [
            {
                state: {
                    dataUpdatedAt: 2000,
                    data: 'query data',
                    dataUpdateCount: 1,
                    error: null,
                    errorUpdateCount: 0,
                    errorUpdatedAt: 0,
                    fetchStatus: 'idle',
                    fetchFailureCount: 0,
                    fetchMeta: null,
                    isInvalidated: false,
                    fetchFailureReason: null,
                    status: 'success'
                },
                queryKey: ['queries', 'key1'],
                queryHash: 'queries-key1'
            },
            {
                state: {
                    dataUpdatedAt: 3000,
                    data: 'query data 2',
                    dataUpdateCount: 1,
                    error: null,
                    errorUpdateCount: 0,
                    errorUpdatedAt: 0,
                    fetchStatus: 'idle',
                    fetchFailureCount: 0,
                    fetchMeta: null,
                    isInvalidated: false,
                    fetchFailureReason: null,
                    status: 'success'
                },
                queryKey: ['queries', 'key2'],
                queryHash: 'queries-key2'
            }
        ]
    }

    it('should update all dataUpdatedAt timestamps with the provided timestamp', () => {
        const specificTime = new Date(2023, 5, 15)
        const result = utils.resetDehydratedStateTimeStamp(mockDehydratedState, specificTime)

        expect(result.queries[0].state.dataUpdatedAt).toBe(specificTime)
        expect(result.queries[1].state.dataUpdatedAt).toBe(specificTime)
    })

    it('should use current time when no timestamp is provided', () => {
        const before = Date.now()

        const result = utils.resetDehydratedStateTimeStamp(mockDehydratedState)
        const after = Date.now()

        expect(result.queries[0].state.dataUpdatedAt).toBeGreaterThanOrEqual(before)
        expect(result.queries[0].state.dataUpdatedAt).toBeLessThanOrEqual(after)

        expect(result.queries[1].state.dataUpdatedAt).toBeGreaterThanOrEqual(before)
        expect(result.queries[1].state.dataUpdatedAt).toBeLessThanOrEqual(after)
    })

    it('should preserve all other properties of the state objects', () => {
        const specificTime = new Date(2023, 5, 15)

        const result = utils.resetDehydratedStateTimeStamp(mockDehydratedState, specificTime)

        expect(result.queries[0].state.data).toBe('query data')
        expect(result.queries[0].queryKey).toEqual(['queries', 'key1'])

        expect(result.queries[1].state.data).toBe('query data 2')
        expect(result.queries[1].queryKey).toEqual(['queries', 'key2'])
    })

    it('should handle empty mutations and queries arrays', () => {
        const emptyState = {
            mutations: [],
            queries: []
        }

        const result = utils.resetDehydratedStateTimeStamp(emptyState, new Date(2023, 5, 15))

        expect(result.mutations).toEqual([])
        expect(result.queries).toEqual([])
    })
})

describe('Utils', () => {
    test.each([
        ['/callback', false],
        ['https://pwa-kit.mobify-storefront.com/callback', true],
        ['/social-login/callback', false]
    ])('isAbsoluteUrl', (url, expected) => {
        const isURL = utils.isAbsoluteUrl(url)
        expect(isURL).toBe(expected)
    })
    test('extractCustomParameters only returns custom parameters', () => {
        const parameters = {
            c_param1: 'this is a custom',
            param1: 'this is not a custom',
            c_param2: 1,
            param2: 2,
            param3: false,
            c_param3: true
        }
        const customParameters = utils.extractCustomParameters(parameters)
        expect(customParameters).toEqual({
            c_param1: 'this is a custom',
            c_param2: 1,
            c_param3: true
        })
    })
})
