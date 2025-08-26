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
        derivedData: {
            hasBasket,
            totalItems,
            shipmentIdToTotalItems,
            totalDeliveryShipments,
            totalPickupShipments,
            pickupStoreIds,
            isMissingShippingAddress,
            isMissingShippingMethod,
            totalShippingCost
        }
    } = useCurrentBasket()
    return (
        <div>
            <div data-testid="basket-id">{currentBasket?.basketId}</div>
            <div data-testid="total-items">{totalItems}</div>
            <div data-testid="has-basket">{hasBasket.toString()}</div>
            <div data-testid="shipment-items">
                {shipmentIdToTotalItems &&
                    Object.entries(shipmentIdToTotalItems).map(([sid, qty]) => (
                        <div key={sid} data-testid={`shipment-${sid}-qty`}>
                            {qty}
                        </div>
                    ))}
            </div>
            <div data-testid="delivery-shipments">{totalDeliveryShipments}</div>
            <div data-testid="pickup-shipments">{totalPickupShipments}</div>
            <div data-testid="pickup-store-ids">{JSON.stringify(pickupStoreIds)}</div>
            <div data-testid="needs-address">{isMissingShippingAddress.toString()}</div>
            <div data-testid="needs-shipping-method">{isMissingShippingMethod.toString()}</div>
            <div data-testid="total-shipping-cost">{totalShippingCost}</div>
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
        // shipmentIdToTotalItems should aggregate quantities per shipment
        // In mockCustomerBaskets, one product item with quantity 2 in shipment "me"
        expect(screen.getByTestId('shipment-me-qty').innerHTML).toBe('2')
        // For the mock, shipments array has one shipment and it is delivery (no pickup method)
        expect(screen.getByTestId('delivery-shipments').innerHTML).toBe('1')
        expect(screen.getByTestId('pickup-shipments').innerHTML).toBe('0')
        // New derived field: pickupStoreIds should be empty for delivery-only mock data
        expect(screen.getByTestId('pickup-store-ids').innerHTML).toBe('[]')
        // New derived fields for checkout step logic
        expect(screen.getByTestId('needs-address').innerHTML).toBe('true')
        expect(screen.getByTestId('needs-shipping-method').innerHTML).toBe('true')
        expect(screen.getByTestId('total-shipping-cost').innerHTML).toBe('0')
    })
})
