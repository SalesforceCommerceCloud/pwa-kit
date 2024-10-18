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
import {
    SHOPPER_CONTEXT_FIELD_TYPES,
    SHOPPER_CONTEXT_SEARCH_PARAMS
} from '@salesforce/retail-react-app/app/constants'

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

    test('returns object with only allowed search params', () => {
        const originalCustomQualifiers = SHOPPER_CONTEXT_SEARCH_PARAMS.customQualifiers
        SHOPPER_CONTEXT_SEARCH_PARAMS.customQualifiers = {a: {paramName: 'a'}, b: {paramName: 'b'}}

        const history = createMemoryHistory()
        history.push('?a=1&b=2&c=3')

        const wrapper = ({children}) => <Router history={history}>{children}</Router>
        const {result} = renderHook(() => useShopperContextSearchParams(), {wrapper})
        expect(result.current).toEqual({customQualifiers: {a: '1', b: '2'}})

        SHOPPER_CONTEXT_SEARCH_PARAMS.customQualifiers = originalCustomQualifiers
    })

    test('returns an object with parsed search params related to shopper context', () => {
        const originalCustomQualifiers = SHOPPER_CONTEXT_SEARCH_PARAMS.customQualifiers
        const originalAssignmentQualifiers = SHOPPER_CONTEXT_SEARCH_PARAMS.assignmentQualifiers
        SHOPPER_CONTEXT_SEARCH_PARAMS.customQualifiers = {deviceType: {paramName: 'deviceType'}}
        SHOPPER_CONTEXT_SEARCH_PARAMS.assignmentQualifiers = {storeId: {paramName: 'storeId'}}

        const history = createMemoryHistory()
        history.push(
            // Source code
            '?sourceCode=instagram' +
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
        const {result} = renderHook(() => useShopperContextSearchParams(), {wrapper})
        expect(result.current).toEqual({
            sourceCode: 'instagram',
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
            }
        })

        SHOPPER_CONTEXT_SEARCH_PARAMS.customQualifiers = originalCustomQualifiers
        SHOPPER_CONTEXT_SEARCH_PARAMS.assignmentQualifiers = originalAssignmentQualifiers
    })
})

describe('getShopperContextFromSearchParams', () => {
    test.each([
        [
            'intParam=123',
            {intField: {paramName: 'intParam', type: SHOPPER_CONTEXT_FIELD_TYPES.INT}},
            {intField: 123}
        ],
        [
            'doubleParam=123.45',
            {doubleField: {paramName: 'doubleParam', type: SHOPPER_CONTEXT_FIELD_TYPES.DOUBLE}},
            {doubleField: 123.45}
        ],
        [
            'arrayParam=value1&arrayParam=value2',
            {arrayField: {paramName: 'arrayParam', type: SHOPPER_CONTEXT_FIELD_TYPES.ARRAY}},
            {arrayField: ['value1', 'value2']}
        ],
        [
            'stringParam=value',
            {stringField: {paramName: 'stringParam', type: 'string'}},
            {stringField: 'value'}
        ],
        ['unknownParam=value', {knownField: {paramName: 'knownParam'}}, {}],
        ['', {knownField: {paramName: 'knownParam'}}, {}]
    ])(
        'should handle %p correctly with mapping %p',
        (queryString, searchParamToparamNameMapping, expected) => {
            const searchParamsObj = new URLSearchParams(queryString)
            expect(
                getShopperContextFromSearchParams(searchParamsObj, searchParamToparamNameMapping)
            ).toEqual(expected)
        }
    )
})
