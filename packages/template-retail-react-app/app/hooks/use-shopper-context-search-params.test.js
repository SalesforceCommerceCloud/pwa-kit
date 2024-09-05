/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router'
import {useShopperContext, useShopperContextsMutation} from '@salesforce/commerce-sdk-react'

import {renderHook} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {
    useShopperContextSearchParams,
    getShopperContextSearchParams
} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'

const siteId = 'my-cool-site'
const usid = 'test-usid'
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useUsid: jest.fn().mockReturnValue({usid}),
        useShopperContext: jest.fn(),
        useShopperContextsMutation: jest.fn()
    }
})

const createShopperContextMutateAsync = jest.fn()
const updateShopperContextMutateAsync = jest.fn()
useShopperContextsMutation.mockImplementation((param) => {
    if (param === 'createShopperContext') {
        return {mutateAsync: createShopperContextMutateAsync}
    } else if (param === 'updateShopperContext') {
        return {mutateAsync: updateShopperContextMutateAsync}
    }
})

jest.mock('@tanstack/react-query', () => {
    const invalidateQueries = jest.fn()
    return {
        useQueryClient: jest.fn(() => ({
            invalidateQueries
        }))
    }
})

afterEach(() => {
    jest.clearAllMocks()
})

describe('useShopperContextSearchParams', () => {
    test('creates an empty shopper context when useShopperContext returns undefined', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        const wrapper = ({children}) => <Router history={history}>{children}</Router>

        useShopperContext.mockReturnValue({data: undefined})
        renderHook(() => useShopperContextSearchParams(siteId), {wrapper})
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContextMutateAsync).toHaveBeenCalledWith({
            parameters: {siteId, usid},
            body: {}
        })
    })

    test('does not create shopper context when useShopperContext returns data', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        const wrapper = ({children}) => <Router history={history}>{children}</Router>

        useShopperContext.mockReturnValue({data: {}})
        renderHook(() => useShopperContextSearchParams(siteId), {wrapper})
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContextMutateAsync).not.toHaveBeenCalled()
    })

    test('updates shopper context with the parsed search params', () => {
        const history = createMemoryHistory()
        history.push('/test/path?sourceCode=instagram&customerGroupIds=BigSpenders')
        const wrapper = ({children}) => <Router history={history}>{children}</Router>

        renderHook(() => useShopperContextSearchParams(siteId), {wrapper})
        expect(updateShopperContextMutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId},
            body: {sourceCode: 'instagram', customerGroupIds: ['BigSpenders']}
        })
    })
})

describe('getShopperContextSearchParams', () => {
    test('returns an empty object when no shopper context search params are present in the search', () => {
        const shopperContextObj = getShopperContextSearchParams('')
        expect(shopperContextObj).toEqual({})
    })

    test('returns an object with the parsed search params', () => {
        const shopperContextObj = getShopperContextSearchParams(
            '?sourceCode=instagram&effectiveDateTime=2024-09-04T00:00:00Z' +
                // Customer Group IDs
                '&customerGroupIds=BigSpenders&customerGroupIds=MobileUsers' +
                // Custom Qualifiers
                '&deviceType=mobile&ipAddress=189.0.0.0&operatingSystem=Android' +
                // Assignment Qualifiers
                '&store=boston'
        )

        expect(shopperContextObj).toEqual({
            sourceCode: 'instagram',
            effectiveDateTime: '2024-09-04T00:00:00Z',
            customQualifiers: {
                deviceType: 'mobile',
                ipAddress: '189.0.0.0',
                operatingSystem: 'Android'
            },
            assignmentQualifiers: {store: 'boston'},
            customerGroupIds: ['BigSpenders', 'MobileUsers']
        })
    })
})
