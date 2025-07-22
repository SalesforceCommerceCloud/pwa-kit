/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {ChakraProvider} from '@chakra-ui/react'
import {getOrderStatusColorScheme} from '@salesforce/retail-react-app/app/pages/account/order-history'

// Mock the commerce-sdk-react hooks
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCustomer: () => ({
        customer: {
            customerId: 'test-customer-id'
        }
    }),
    useOrders: () => ({
        data: {
            data: [
                {
                    orderId: 'test-order-1',
                    orderNo: 'ORDER-001',
                    status: 'cancelled',
                    productItems: [
                        {productId: 'prod-1', productName: 'Test Product 1'},
                        {productId: 'prod-2', productName: 'Test Product 2'}
                    ]
                },
                {
                    orderId: 'test-order-2',
                    orderNo: 'ORDER-002',
                    status: 'created',
                    productItems: [{productId: 'prod-3', productName: 'Test Product 3'}]
                }
            ]
        },
        isLoading: false
    })
}))

// Mock the useRouter hook
jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/hooks', () => ({
    useRouter: () => ({
        path: '/account/order-history',
        asPath: '/account/order-history'
    })
}))

describe('Order Status Badge Colors', () => {
    const renderWithProviders = (component) => {
        return render(
            <IntlProvider locale="en">
                <ChakraProvider>{component}</ChakraProvider>
            </IntlProvider>
        )
    }

    test('getOrderStatusColorScheme helper returns correct colors for cancelled status', () => {
        const cancelledColor = getOrderStatusColorScheme('cancelled')
        expect(cancelledColor).toEqual({
            bg: '#ff5722',
            color: 'white'
        })
    })

    test('getOrderStatusColorScheme helper returns correct colors for created status', () => {
        const createdColor = getOrderStatusColorScheme('created')
        expect(createdColor).toEqual({
            bg: '#cdefc4',
            color: '#194e31'
        })
    })

    test('getOrderStatusColorScheme helper handles case insensitive status', () => {
        const cancelledColor = getOrderStatusColorScheme('CANCELLED')
        expect(cancelledColor).toEqual({
            bg: '#ff5722',
            color: 'white'
        })
    })

    test('getOrderStatusColorScheme helper returns default colors for unknown status', () => {
        const unknownColor = getOrderStatusColorScheme('unknown')
        expect(unknownColor).toEqual({
            bg: 'gray',
            color: 'white'
        })
    })
})
