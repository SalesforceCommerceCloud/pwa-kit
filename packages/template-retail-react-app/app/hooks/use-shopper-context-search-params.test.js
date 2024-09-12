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
import {
    useShopperContextSearchParams,
    getShopperContextFromSearchParams
} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'
import {SHOPPER_CONTEXT_FIELD_TYPES} from '@salesforce/retail-react-app/app/constants'

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
        const customQualifiers = {deviceType: {paramName: 'deviceType'}}
        const assignmentQualifiers = {storeId: {paramName: 'storeId'}}
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

describe('getShopperContextFromSearchParams', () => {
    test.each([
        [
            new URLSearchParams('intParam=123'),
            {intField: {paramName: 'intParam', type: SHOPPER_CONTEXT_FIELD_TYPES.INT}},
            {intField: 123}
        ],
        [
            new URLSearchParams('doubleParam=123.45'),
            {doubleField: {paramName: 'doubleParam', type: SHOPPER_CONTEXT_FIELD_TYPES.DOUBLE}},
            {doubleField: 123.45}
        ],
        [
            new URLSearchParams('arrayParam=value1&arrayParam=value2'),
            {arrayField: {paramName: 'arrayParam', type: SHOPPER_CONTEXT_FIELD_TYPES.ARRAY}},
            {arrayField: ['value1', 'value2']}
        ],
        [
            new URLSearchParams('stringParam=value'),
            {stringField: {paramName: 'stringParam', type: 'string'}},
            {stringField: 'value'}
        ],
        [
            new URLSearchParams('unknownParam=value'),
            {knownField: {paramName: 'knownParam', type: SHOPPER_CONTEXT_FIELD_TYPES.STRING}},
            {}
        ]
    ])(
        'should handle %p correctly with mapping %p',
        (searchParamsObj, searchParamToparamNameMapping, expected) => {
            expect(
                getShopperContextFromSearchParams(searchParamsObj, searchParamToparamNameMapping)
            ).toEqual(expected)
        }
    )
})
