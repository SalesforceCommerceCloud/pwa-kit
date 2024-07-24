/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {mergeOptions, getCustomKeys, pickValidParams} from './utils'

describe('Hook utils', () => {
    test('mergeOptions merges body, header, and options', () => {
        // Required to match the interface, not important for the test
        const config = {
            shortCode: 'shortCode',
            clientId: 'clientId',
            organizationId: 'organizationId',
            siteId: 'siteId'
        }
        const client = new ShopperBaskets({
            parameters: {
                ...config,
                clientParameter: 'clientParameter'
            },
            headers: {
                clientHeader: 'clientHeader'
            }
        })
        const options = {
            body: {body: 'body'},
            parameters: {optionsParameter: 'optionsParameter'},
            headers: {optionsHeader: 'optionsHeader'}
        }
        const merged = mergeOptions(client, options)
        expect(merged).toEqual({
            body: {body: 'body'},
            parameters: {
                ...config,
                clientParameter: 'clientParameter',
                optionsParameter: 'optionsParameter'
            },
            headers: {
                clientHeader: 'clientHeader',
                optionsHeader: 'optionsHeader'
            }
        })
    })

    test('pickValidParams', () => {
        const parameters = {
            basketId: '',
            organizationId: '',
            siteId: '',
            locale: '',
            hello: 1,
            c_foo: 2
        }
        const paramKeys = ['organizationId', 'basketId', 'siteId', 'locale'] as const
        const result = pickValidParams(parameters, paramKeys)

        // @ts-expect-error: testing invalid property
        expect(result.hello).toBeUndefined()

        expect(result.basketId).toBeDefined()
        expect(result.c_foo).toBeDefined()
    })
})

describe('getCustomKey', function () {
    test('throw error for invalid input', () => {
        //@ts-expect-error wrong typed arg is passed intentional to test error
        expect(() => getCustomKeys(null)).toThrow()
    })

    test('returns custom key c_ as output', () => {
        const res = getCustomKeys({
            some_key: 'hello',
            c_key: 'custom key value',
            c_custom: 'another value'
        })
        expect(res).toEqual(['c_key', 'c_custom'])
    })

    test('returns empty when there is no custom key in the input', () => {
        const res = getCustomKeys({
            some_key: 'hello'
        })
        expect(res).toEqual([])
    })
})
