/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import {renderHook} from '@testing-library/react'
import {useAppData} from './use-app-data'

// Mock dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCategory: jest.fn()
}))

jest.mock('../../../hooks', () => ({
    useCurrentCustomer: jest.fn(),
    useCurrentBasket: jest.fn()
}))

jest.mock('../../../utils/utils', () => ({
    flatten: jest.fn()
}))

const mockCategoriesTree = {
    id: 'root',
    name: 'Root',
    categories: [
        {id: 'mens', name: 'Mens'},
        {id: 'womens', name: 'Womens'}
    ]
}

const mockFlattenedCategories = {
    mens: {id: 'mens', name: 'Mens'},
    womens: {id: 'womens', name: 'Womens'}
}

const mockCustomer = {
    customerId: 'test-customer',
    email: 'test@example.com',
    isRegistered: true
}

const mockBasket = {
    basketId: 'test-basket',
    currency: 'USD',
    productItems: []
}

describe('useAppData', () => {
    beforeEach(() => {
        const {useCategory} = require('@salesforce/commerce-sdk-react')
        const {useCurrentCustomer, useCurrentBasket} = require('../../../hooks')
        const {flatten} = require('../../../utils/utils')

        useCategory.mockReturnValue({data: mockCategoriesTree})
        useCurrentCustomer.mockReturnValue({data: mockCustomer})
        useCurrentBasket.mockReturnValue({data: mockBasket})
        flatten.mockReturnValue(mockFlattenedCategories)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns categories tree, flattened categories, customer, and basket data', () => {
        const {result} = renderHook(() => useAppData())

        expect(result.current.categoriesTree).toEqual(mockCategoriesTree)
        expect(result.current.categories).toEqual(mockFlattenedCategories)
        expect(result.current.customer).toEqual(mockCustomer)
        expect(result.current.basket).toEqual(mockBasket)
    })

    test('fetches categories tree with correct parameters', () => {
        const {useCategory} = require('@salesforce/commerce-sdk-react')

        renderHook(() => useAppData())

        expect(useCategory).toHaveBeenCalledWith({
            parameters: {
                id: 'root',
                levels: 1
            }
        })
    })

    test('flattens categories tree correctly', () => {
        const {flatten} = require('../../../utils/utils')

        renderHook(() => useAppData())

        expect(flatten).toHaveBeenCalledWith(mockCategoriesTree, 'categories')
    })

    test('handles empty categories tree', () => {
        const {useCategory} = require('@salesforce/commerce-sdk-react')
        const {flatten} = require('../../../utils/utils')

        useCategory.mockReturnValue({data: null})
        flatten.mockReturnValue({})

        const {result} = renderHook(() => useAppData())

        expect(flatten).toHaveBeenCalledWith({}, 'categories')
        expect(result.current.categoriesTree).toBeNull()
        expect(result.current.categories).toEqual({})
    })

    test('calls customer and basket hooks', () => {
        const {useCurrentCustomer, useCurrentBasket} = require('../../../hooks')

        renderHook(() => useAppData())

        expect(useCurrentCustomer).toHaveBeenCalledTimes(1)
        expect(useCurrentBasket).toHaveBeenCalledTimes(1)
    })
})
