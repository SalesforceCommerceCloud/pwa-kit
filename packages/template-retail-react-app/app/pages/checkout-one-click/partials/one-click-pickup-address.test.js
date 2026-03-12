/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, cleanup} from '@testing-library/react'
import PickupAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-pickup-address'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Mock useShopperBasketsMutation
const mockMutateAsync = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperBasketsV2Mutation: () => ({
            mutateAsync: mockMutateAsync
        }),
        useStores: () => ({
            data: {
                data: [
                    {
                        id: 'store-123',
                        name: 'Test Store',
                        address1: '123 Main Street',
                        city: 'San Francisco',
                        stateCode: 'CA',
                        postalCode: '94105',
                        countryCode: 'US',
                        phone: '555-123-4567',
                        c_customerServiceEmail: 'store@example.com',
                        storeHours: '<p>Mon-Fri: 9AM-6PM</p>',
                        storeType: 'retail'
                    }
                ]
            },
            isLoading: false,
            error: null
        })
    }
})

// Ensure useMultiSite returns site.id = 'site-1' for all tests
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'site-1'}
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({
        data: {
            basketId: 'e4547d1b21d01bf5ad92d30c9d',
            currency: 'GBP',
            customerInfo: {
                customerId: 'ablXcZlbAXmewRledJmqYYlKk0'
            },
            orderTotal: 25.17,
            productItems: [
                {
                    itemId: '7f9637386161502d31f4563db5',
                    itemText: 'Long Sleeve Crew Neck',
                    price: 19.18,
                    productId: '701643070725M',
                    productName: 'Long Sleeve Crew Neck',
                    quantity: 2,
                    shipmentId: 'me'
                }
            ],
            shipments: [
                {
                    shipmentId: 'me',
                    shipmentTotal: 25.17,
                    shippingStatus: 'not_shipped',
                    shippingTotal: 5.99,
                    c_fromStoreId: 'store-123',
                    c_deliveryType: 'pickup'
                }
            ]
        },
        derivedData: {
            hasBasket: true,
            totalItems: 2
        }
    })
}))

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
    () => ({
        useCheckout: () => ({
            step: 1,
            STEPS: {
                CONTACT_INFO: 0,
                PICKUP_ADDRESS: 1,
                SHIPPING_ADDRESS: 2,
                SHIPPING_OPTIONS: 3,
                PAYMENT: 4,
                REVIEW_ORDER: 5
            },
            goToStep: jest.fn()
        })
    })
)

describe('PickupAddress', () => {
    beforeEach(() => {
        jest.resetModules()
        jest.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
        jest.clearAllMocks()
    })

    test('displays pickup address when available', async () => {
        renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Pickup Address & Information')).toBeInTheDocument()
        })

        expect(screen.getByText('Store Information')).toBeInTheDocument()
        expect(screen.getByText('Continue to Payment')).toBeInTheDocument()

        // Verify store name is displayed
        expect(screen.getByText('Test Store')).toBeInTheDocument()

        // Verify store address is displayed
        expect(screen.getByText('123 Main Street')).toBeInTheDocument()
        expect(screen.getByText('San Francisco, CA 94105')).toBeInTheDocument()

        // Verify Store Hours accordion is present
        expect(screen.getByText('Store Hours')).toBeInTheDocument()

        // Verify Store Contact Info accordion is present
        expect(screen.getByText('Store Contact Info')).toBeInTheDocument()
    })

    test('submits pickup address and continues to payment', async () => {
        const {user} = renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Continue to Payment')).toBeInTheDocument()
        })

        await user.click(screen.getByText('Continue to Payment'))

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'e4547d1b21d01bf5ad92d30c9d',
                    shipmentId: 'me',
                    useAsBilling: false
                },
                body: {
                    address1: '123 Main Street',
                    city: 'San Francisco',
                    countryCode: 'US',
                    postalCode: '94105',
                    stateCode: 'CA',
                    firstName: 'Test Store',
                    lastName: 'Pickup',
                    phone: '555-123-4567'
                }
            })
        })
    })

    test('displays store hours when accordion is expanded', async () => {
        const {user} = renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Store Hours')).toBeInTheDocument()
        })

        // Click to expand the Store Hours accordion
        await user.click(screen.getByText('Store Hours'))

        await waitFor(() => {
            expect(screen.getByText('Mon-Fri: 9AM-6PM')).toBeInTheDocument()
        })
    })

    test('displays store contact info when accordion is expanded', async () => {
        const {user} = renderWithProviders(<PickupAddress />)

        await waitFor(() => {
            expect(screen.getByText('Store Contact Info')).toBeInTheDocument()
        })

        // Click to expand the Store Contact Info accordion
        await user.click(screen.getByText('Store Contact Info'))

        await waitFor(() => {
            // Email and phone are in the same element separated by <br />, use substring matcher
            expect(screen.getByText(/Email: store@example\.com/)).toBeInTheDocument()
            expect(screen.getByText(/Phone: 555-123-4567/)).toBeInTheDocument()
        })
    })
})
