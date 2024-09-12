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
            // Shopper Context Search Params
            '?sourceCode=instagram&effectiveDateTime=2024-09-04T00:00:00Z&clientIp=13.108.0.0' +
                // Customer Group IDs
                '&customerGroupIds=BigSpenders&customerGroupIds=MobileUsers' +
                // GeoLocation
                '&countryCode=CA&city=toronto&latitude=11.1111&longitude=22.2222&metroCode=AB&postalCode=A3B2C5&region=soemwhere&regionCode=ZZ' +
                // Custom Qualifiers
                '&deviceType=mobile' +
                // Assignment Qualifiers
                '&storeId=boston' +
                // Non Shopper Context Params
                '&a=1&b=2&c=3'
        )

        const wrapper = ({children}) => <Router history={history}>{children}</Router>
        const customQualifiers = {deviceType: {apiField: 'deviceType'}}
        const assignmentQualifiers = {storeId: {apiField: 'storeId'}}
        const {result} = renderHook(
            () => useShopperContextSearchParams(customQualifiers, assignmentQualifiers),
            {wrapper}
        )
        expect(result.current).toEqual({
            sourceCode: 'instagram',
            effectiveDateTime: '2024-09-04T00:00:00Z',
            clientIp: '13.108.0.0',
            geoLocation: {
                countryCode: 'CA',
                city: 'toronto',
                latitude: 11.1111,
                longitude: 22.2222,
                metroCode: 'AB',
                postalCode: 'A3B2C5',
                region: 'soemwhere',
                regionCode: 'ZZ'
            },
            customQualifiers: {
                deviceType: 'mobile'
            },
            assignmentQualifiers: {
                storeId: 'boston'
            },
            customerGroupIds: ['BigSpenders', 'MobileUsers']
        })
    })
})
