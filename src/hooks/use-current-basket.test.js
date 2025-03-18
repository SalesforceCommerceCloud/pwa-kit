/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {mockCustomerBaskets} from '@salesforce/retail-react-app/app/mocks/mock-data'

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
const mockAsyncMutate = jest.fn()
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
        derivedData: {hasBasket, totalItems}
    } = useCurrentBasket()
    return (
        <div>
            <div data-testid="basket-id">{currentBasket?.basketId}</div>
            <div data-testid="total-items">{totalItems}</div>
            <div data-testid="has-basket">{hasBasket.toString()}</div>
        </div>
    )
}

describe('useCurrentBasket', function () {
    beforeEach(() => {
        jest.resetModules()
    })

    test('returns current basket and derivedData when both customerId and basket are defined', async () => {
        mockAsyncMutate.mockImplementationOnce(() => ({
            ...mockCustomerBaskets.baskets[0],
            basketId
        }))
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
