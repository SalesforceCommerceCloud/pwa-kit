/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {screen, renderHook, waitFor} from '@testing-library/react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCustomerBaskets, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {
    mockCustomerBaskets,
    mockEmptyBasket
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import emptyBasket from '@salesforce/retail-react-app/app/mocks/empty-basket'

const MOCK_USE_QUERY_RESULT = {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isIdle: false,
    isLoading: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    status: 'success',
    refetch: jest.fn(),
    remove: jest.fn()
}
let mockFnc
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    mockFnc = jest.fn(() => {
        return {
            mutateAsync: jest.fn()
        }
    })
    return {
        ...originalModule,
        useCustomerId: jest.fn(() => 'customer-id'),
        useCustomerBaskets: jest.fn(),
        useShopperBasketsMutation: mockFnc
    }
})
const MockComponent = () => {
    const {
        data: currentBasket,
        derivedData: {hasBasket, totalItems},
        mutations: {addItemToBasket}
    } = useCurrentBasket()

    return (
        <div>
            <div data-testid="basket-id">{currentBasket?.basketId}</div>
            <div data-testid="total-items">{totalItems}</div>
            <div data-testid="has-basket">{hasBasket}</div>
            <button
                onClick={async () => {
                    await addItemToBasket([
                        {
                            productId: 'product-123',
                            price: 100,
                            quantity: 1
                        }
                    ])
                }}
            >
                Add To Cart
            </button>
        </div>
    )
}

describe('useCurrentBasket', function () {
    test('returns baskets when customerId is defined assuming basket has been created', () => {
        useCustomerBaskets.mockImplementation(() => {
            return {
                data: mockCustomerBaskets,
                isLoading: false
            }
        })
        const expectedBasketId = mockCustomerBaskets.baskets[0].basketId
        renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('basket-id').innerHTML).toEqual(expectedBasketId)
        expect(screen.getByTestId('total-items').innerHTML).toEqual(2)
        expect(screen.getByTestId('has-basket').innerHTML).toBeTruthy()
    })

    test.only('creates basket before add an item to cart when a user has no basket', async () => {
        useCustomerBaskets.mockImplementation(() => {
            return {
                data: {total: 0},
                isLoading: false,
                ...MOCK_USE_QUERY_RESULT
            }
        })
        const {user} = renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('basket-id').innerHTML).toEqual('')
        console.log('mockFnc', mockFnc)
        const addToCarBtn = screen.getByText(/add to cart/i)
        await user.click(addToCarBtn)
        screen.logTestingPlaygroundURL()
        // useCustomerBaskets.mockImplementation(() => {
        //     return {
        //         data: {total: 1, baskets: mockEmptyBasket},
        //         isLoading: false,
        //         ...MOCK_USE_QUERY_RESULT
        //     }
        // })
        const expectedBasketId = mockEmptyBasket.baskets[0].basketId
        expect(screen.getByTestId('basket-id').innerHTML).toEqual(expectedBasketId)
    })
})
