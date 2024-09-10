/*
 * Copyright (c) 2024, salesforce.com, inc.
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
    getShopperContextSearchParams,
    handleShopperContextUpdate
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

const createShopperContext = {mutateAsync: jest.fn()}
const updateShopperContext = {mutateAsync: jest.fn()}
useShopperContextsMutation.mockImplementation((param) => {
    if (param === 'createShopperContext') {
        return createShopperContext
    } else if (param === 'updateShopperContext') {
        return updateShopperContext
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
    test('does not create/update the shopper context when no shopper context search params are present', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        const wrapper = ({children}) => <Router history={history}>{children}</Router>

        useShopperContext.mockReturnValue({data: undefined})
        renderHook(() => useShopperContextSearchParams(siteId), {wrapper})
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
        expect(updateShopperContext.mutateAsync).not.toHaveBeenCalled()
    })

    test('creates shopper context with the parsed search params', () => {
        const history = createMemoryHistory()
        history.push('/test/path?sourceCode=instagram&customerGroupIds=BigSpenders')
        const wrapper = ({children}) => <Router history={history}>{children}</Router>

        renderHook(() => useShopperContextSearchParams(siteId), {wrapper})
        expect(createShopperContext.mutateAsync).toHaveBeenCalledWith({
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

    test('returns an empty object when search params not related to shopper context are present', () => {
        const shopperContextObj = getShopperContextSearchParams('?a=1&b=2&c=3')
        expect(shopperContextObj).toEqual({})
    })

    test('returns an object with parsed search params related to shopper context', () => {
        const shopperContextObj = getShopperContextSearchParams(
            '?sourceCode=instagram&effectiveDateTime=2024-09-04T00:00:00Z' +
                // Customer Group IDs
                '&customerGroupIds=BigSpenders&customerGroupIds=MobileUsers' +
                // Custom Qualifiers
                '&deviceType=mobile&ipAddress=189.0.0.0&operatingSystem=Android' +
                // Assignment Qualifiers
                '&store=boston' +
                // Non Shopper Context Params
                '&a=1&b=2&c=3'
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

    describe('handleShopperContextUpdate', () => {
        const updateShopperContextObj = {
            sourceCode: 'instagram',
            customerGroupIds: ['BigSpenders']
        }
        const refetchDataOnClient = jest.fn()

        test('creates the shopper context when shopper context is undefined', () => {
            const shopperContext = undefined
            handleShopperContextUpdate({
                createShopperContext,
                updateShopperContext,
                shopperContext,
                updateShopperContextObj,
                usid,
                siteId,
                refetchDataOnClient
            })
            expect(createShopperContext.mutateAsync).toHaveBeenCalledWith({
                parameters: {usid, siteId},
                body: updateShopperContextObj
            })
            expect(updateShopperContext.mutateAsync).not.toHaveBeenCalled()
        })

        test('updates the shopper context when shopper context is an empty object', () => {
            const shopperContext = {}
            handleShopperContextUpdate({
                createShopperContext,
                updateShopperContext,
                shopperContext,
                updateShopperContextObj,
                usid,
                siteId,
                refetchDataOnClient
            })
            expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
            expect(updateShopperContext.mutateAsync).toHaveBeenCalledWith({
                parameters: {usid, siteId},
                body: updateShopperContextObj
            })
        })

        test('updates the shopper context when shopper context is an object', () => {
            const shopperContext = {sourceCode: 'facebook'}
            handleShopperContextUpdate({
                createShopperContext,
                updateShopperContext,
                shopperContext,
                updateShopperContextObj,
                usid,
                siteId,
                refetchDataOnClient
            })
            expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
            expect(updateShopperContext.mutateAsync).toHaveBeenCalledWith({
                parameters: {usid, siteId},
                body: updateShopperContextObj
            })
        })
    })
})
