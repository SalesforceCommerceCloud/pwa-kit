/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {
    mockCustomerBaskets,
    mockEmptyBasket
} from '@salesforce/retail-react-app/app/mocks/mock-data'

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

const basketId = '10cf6aa40edba4fcfcc6915594'
const mockAsyncMutate = jest
    .fn()
    .mockImplementationOnce(() => ({
        ...mockEmptyBasket.baskets[0],
        basketId
    }))
    .mockImplementationOnce(() => ({
        ...mockCustomerBaskets.baskets[0],
        basketId
    }))
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCustomerId: jest.fn(() => 'abmuc2wupJxeoRxuo3wqYYmbhI'),
        useCustomerBaskets: jest.fn(),
        useShopperBasketsMutation: () => ({
            mutateAsync: mockAsyncMutate
        })
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
            <div data-testid="has-basket">{hasBasket.toString()}</div>
            <button
                onClick={async () => {
                    const res = await addItemToBasket([
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
    beforeEach(() => {
        jest.resetModules()
    })

    test('creates basket before add an item to cart when a user has no basket', async () => {
        useCustomerBaskets.mockImplementation(() => {
            return {
                ...MOCK_USE_QUERY_RESULT,
                data: {total: 0},
                isLoading: false
            }
        })
        const {user} = await renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('basket-id').innerHTML).toBe('')
        const addToCarBtn = screen.getByText(/add to cart/i)
        await user.click(addToCarBtn)

        const expectedBasketId = mockEmptyBasket.baskets[0].basketId

        expect(mockAsyncMutate).toHaveBeenCalledTimes(2)
        await waitFor(() => expect(mockAsyncMutate.mock.calls[0][0]).toEqual({body: {}}))

        await waitFor(() =>
            expect(mockAsyncMutate.mock.calls[1][0]).toEqual({
                parameters: {basketId: expectedBasketId},
                body: [
                    {
                        productId: 'product-123',
                        price: 100,
                        quantity: 1
                    }
                ]
            })
        )
    })

    test('returns baskets when customerId is defined assuming basket has been created', async () => {
        useCustomerBaskets.mockImplementation(() => {
            return {
                ...MOCK_USE_QUERY_RESULT,
                data: mockCustomerBaskets,
                isLoading: false
            }
        })
        const expectedBasketId = mockCustomerBaskets.baskets[0].basketId
        await renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('basket-id').innerHTML).toEqual(expectedBasketId)
        expect(screen.getByTestId('total-items').innerHTML).toBe('2')
        expect(screen.getByTestId('has-basket').innerHTML).toBeTruthy()
    })
})
