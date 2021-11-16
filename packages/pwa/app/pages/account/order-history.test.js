/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {AccountOrdersProvider} from './util/order-context'
import OrderHistory from './order-history'
import {
    mockedRegisteredCustomer,
    mockOrderHistory,
    mockOrderProducts
} from '../../commerce-api/mock-data'

jest.setTimeout(30000)

const MockedOrderHistory = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])

    //Only render orders after login is complete
    if (!customer.customerId) {
        return null
    }
    return (
        <div>
            <div>{customer.customerId}</div>
            <AccountOrdersProvider>
                <OrderHistory />
            </AccountOrdersProvider>
        </div>
    )
}

jest.mock('../../commerce-api/auth', () => {
    return class AuthMock {
        login() {
            return mockedRegisteredCustomer
        }
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async getCustomerOrders() {
                return mockOrderHistory
            }

            async getCustomer() {
                return mockedRegisteredCustomer
            }
        },
        ShopperProducts: class ShopperProductsMock extends sdk.ShopperProducts {
            async getProducts() {
                return mockOrderProducts
            }
        }
    }
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Renders order history', async () => {
    renderWithProviders(<MockedOrderHistory />)
    expect(await screen.findByTestId('account-order-history-page')).toBeInTheDocument()
    expect(await screen.findAllByText(/Ordered: /i)).toHaveLength(3)
    expect(
        await screen.findAllByAltText(
            'Pleated Bib Long Sleeve Shirt, Silver Grey, small',
            {},
            {timeout: 15000}
        )
    ).toHaveLength(3)
})
