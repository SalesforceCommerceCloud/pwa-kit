/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router, Page} from 'react-router'
import {useShopperContext, useShopperContextsMutation} from '@salesforce/commerce-sdk-react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {createMemoryHistory} from 'history'
import {
    useShopperContextSearchParams,
    getShopperContextSearchParams,
    handleShopperContextUpdate
} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'

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

// jest.mock('@tanstack/react-query', () => {
//     const invalidateQueries = jest.fn()
//     return {
//         useQueryClient: jest.fn(() => ({
//             invalidateQueries
//         }))
//     }
// })

afterEach(() => {
    jest.clearAllMocks()
})

describe('useShopperContextSearchParams', () => {
    const MockComponent = () => {
        useShopperContextSearchParams()
        return
        // return (
        //     <script data-testid="variant" type="application/json">
        //         {JSON.stringify(variant)}
        //     </script>
        // )
    }
    

    test('does not create/update the shopper context when no shopper context search params are present', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        useShopperContext.mockReturnValue({data: undefined})
        renderWithProviders(<Router history={history}><MockComponent /></Router>)
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
        expect(updateShopperContext.mutateAsync).not.toHaveBeenCalled()
    })

    test('creates shopper context when shopper context is undefined', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram&customerGroupIds=BigSpenders')
        useShopperContext.mockReturnValue({data: undefined})
        renderWithProviders(<Router history={history}><MockComponent /></Router>)
        expect(createShopperContext.mutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId: 'site-1'},
            body: {sourceCode: 'instagram', customerGroupIds: ['BigSpenders']}
        })
    })

    test('updates shopper context when shopper context is an empty object', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram&customerGroupIds=BigSpenders')
        useShopperContext.mockReturnValue({data: {}})
        renderWithProviders(<Router history={history}><MockComponent /></Router>)
        expect(updateShopperContext.mutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId: 'site-1'},
            body: {sourceCode: 'instagram', customerGroupIds: ['BigSpenders']}
        })
    })

    test('updates shopper context when shopper context is an object with values', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram&customerGroupIds=BigSpenders')
        useShopperContext.mockReturnValue({data: {sourceCode: 'facebook'}})
        renderWithProviders(<Router history={history}><MockComponent /></Router>)
        expect(updateShopperContext.mutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId: 'site-1'},
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
        const customQualifiers = {DEVICE_TYPE: 'deviceType', OPERATING_SYSTEMS: 'operatingSystems'}
        const assignmentQualifiers = {STORE_ID: 'storeId', STORES: 'stores'}
        const arraySearchParams = [customQualifiers.OPERATING_SYSTEMS, assignmentQualifiers.STORES]
        const shopperContextObj = getShopperContextSearchParams(
            '?sourceCode=instagram&effectiveDateTime=2024-09-04T00:00:00Z' +
                // Customer Group IDs
                '&customerGroupIds=BigSpenders&customerGroupIds=MobileUsers' +
                // Custom Qualifiers
                '&deviceType=mobile&operatingSystems=mac&operatingSystems=windows' +
                // Assignment Qualifiers
                '&storeId=5&stores=boston&stores=newyork' +
                // Non Shopper Context Params
                '&a=1&b=2&c=3',
                customQualifiers,
                assignmentQualifiers,
                arraySearchParams
        )

        expect(shopperContextObj).toEqual({
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
