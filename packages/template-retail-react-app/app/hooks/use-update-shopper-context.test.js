/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router'
import {useShopperContext, useShopperContextsMutation} from '@salesforce/commerce-sdk-react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {createMemoryHistory} from 'history'
import {useUpdateShopperContext} from '@salesforce/retail-react-app/app/hooks/use-update-shopper-context'

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

afterEach(() => {
    jest.clearAllMocks()
})

describe('useShopperContextSearchParams', () => {
    const MockComponent = () => {
        useUpdateShopperContext()
        return
    }

    test('does not create/update the shopper context when no shopper context search params are present', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        useShopperContext.mockReturnValue({data: undefined, isLoading: false})
        renderWithProviders(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
        expect(updateShopperContext.mutateAsync).not.toHaveBeenCalled()
    })

    test('does not create/update the shopper context when isLoading is true', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        useShopperContext.mockReturnValue({data: undefined, isLoading: true})
        renderWithProviders(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
        expect(updateShopperContext.mutateAsync).not.toHaveBeenCalled()
    })

    test('does not create/update the shopper context when current the shopper context deep equals the updateShopperContextObj', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram&city=Toronto')
        useShopperContext.mockReturnValue({
            data: {sourceCode: 'instagram', geoLocation: {city: 'Toronto'}},
            isLoading: false
        })
        renderWithProviders(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(useShopperContext).toHaveBeenCalledTimes(1)
        expect(createShopperContext.mutateAsync).not.toHaveBeenCalled()
        expect(updateShopperContext.mutateAsync).not.toHaveBeenCalled()
    })

    test('creates shopper context when shopper context is undefined', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram')
        useShopperContext.mockReturnValue({data: undefined, isLoading: false})
        renderWithProviders(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(createShopperContext.mutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId: 'site-1'},
            body: {sourceCode: 'instagram'}
        })
    })

    test('updates shopper context when shopper context is an empty object', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram')
        useShopperContext.mockReturnValue({data: {}, isLoading: false})
        renderWithProviders(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(updateShopperContext.mutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId: 'site-1'},
            body: {sourceCode: 'instagram'}
        })
    })

    test('updates shopper context when shopper context is an object with values', () => {
        const history = createMemoryHistory()
        history.push('/test/path/?sourceCode=instagram')
        useShopperContext.mockReturnValue({data: {sourceCode: 'facebook'}, isLoading: false})
        renderWithProviders(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(updateShopperContext.mutateAsync).toHaveBeenCalledWith({
            parameters: {usid, siteId: 'site-1'},
            body: {sourceCode: 'instagram'}
        })
    })
})
