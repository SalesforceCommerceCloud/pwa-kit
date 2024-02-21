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
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCustomerId: jest.fn(() => 'customer-id'),
        useCustomerBaskets: jest.fn()
    }
})
const MockComponent = ({isLazyBasketCreation = false}) => {
    const {
        data: currentBasket,
        derivedData: {hasBasket}
    } = useCurrentBasket()
    console.log('currentBasket', currentBasket?.basketId)
    const createBasket = useShopperBasketsMutation('createBasket')

    // useEffect(() => {
    //     console.log('!hasBasket && !isLazyBasketCreation', hasBasket, isLazyBasketCreation)
    //     if (!hasBasket && !isLazyBasketCreation) {
    //         console.log('test------------------')
    //         const rest = createBasket.mutate({
    //             body: {}
    //         })
    //     }
    // }, [hasBasket])

    return (
        <div>
            <div data-testid="basket-id">{currentBasket?.basketId}</div>
            <button>Add To Cart</button>
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
    })

    test('returns data with no baskets when customerId is defined but customer has no basket created', () => {
        useCustomerBaskets.mockImplementation(() => {
            return {
                data: {total: 0},
                isLoading: false,
                ...MOCK_USE_QUERY_RESULT
            }
        })
        renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('basket-id').innerHTML).toEqual('')
    })
})
