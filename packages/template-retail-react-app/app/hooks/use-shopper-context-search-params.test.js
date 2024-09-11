/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router'
import {renderHook} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {useShopperContextSearchParams} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'

afterEach(() => {
    jest.clearAllMocks()
})

describe('useShopperContextSearchParams', () => {
    test('returns an empty object when no search params are present', () => {
        const history = createMemoryHistory()
        history.push('')

        const wrapper = ({children}) => <Router history={history}>{children}</Router>
        const {result} = renderHook(() => useShopperContextSearchParams(), {wrapper})
        expect(result.current).toEqual({})
    })

    test('returns an empty object when search params not related to shopper context are present', () => {
        const history = createMemoryHistory()
        history.push('?a=1&b=2&c=3')

        const wrapper = ({children}) => <Router history={history}>{children}</Router>
        const {result} = renderHook(() => useShopperContextSearchParams(), {wrapper})
        expect(result.current).toEqual({})
    })

    test('returns an object with parsed search params related to shopper context', () => {
        const history = createMemoryHistory()
        history.push(
            '?sourceCode=instagram&effectiveDateTime=2024-09-04T00:00:00Z' +
                // Customer Group IDs
                '&customerGroupIds=BigSpenders&customerGroupIds=MobileUsers' +
                // Custom Qualifiers
                '&deviceType=mobile&operatingSystems=mac&operatingSystems=windows' +
                // Assignment Qualifiers
                '&storeId=5&stores=boston&stores=newyork' +
                // Non Shopper Context Params
                '&a=1&b=2&c=3'
        )

        const wrapper = ({children}) => <Router history={history}>{children}</Router>
        const customQualifiers = {DEVICE_TYPE: 'deviceType', OPERATING_SYSTEMS: 'operatingSystems'}
        const assignmentQualifiers = {STORE_ID: 'storeId', STORES: 'stores'}
        const arraySearchParams = [customQualifiers.OPERATING_SYSTEMS, assignmentQualifiers.STORES]
        const {result} = renderHook(
            () =>
                useShopperContextSearchParams(
                    customQualifiers,
                    assignmentQualifiers,
                    arraySearchParams
                ),
            {wrapper}
        )
        expect(result.current).toEqual({
            sourceCode: 'instagram',
            effectiveDateTime: '2024-09-04T00:00:00Z',
            customQualifiers: {
                deviceType: 'mobile',
                operatingSystems: ['mac', 'windows']
            },
            assignmentQualifiers: {
                storeId: '5',
                stores: ['boston', 'newyork']
            },
            customerGroupIds: ['BigSpenders', 'MobileUsers']
        })
    })
})
