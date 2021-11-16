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
import OrderDetail from './order-detail'
import {keysToCamel} from '../../commerce-api/utils'
import {
    mockedRegisteredCustomer,
    mockOrderHistory,
    mockOrderProducts,
    ocapiOrderResponse
} from '../../commerce-api/mock-data'

const mockOrder = keysToCamel({
    basket_id: 'testorderbasket',
    ...ocapiOrderResponse
})

jest.setTimeout(30000)

const MockedOrderDetails = () => {
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
                <OrderDetail />
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

jest.mock('../../commerce-api/ocapi-shopper-orders', () => {
    return class OcapiShopperOrdersMock {
        async getOrder() {
            return mockOrder
        }
    }
})

jest.mock('react-router', () => {
    const router = jest.requireActual('react-router')
    return {
        ...router,
        useRouteMatch() {
            return {
                url: '/orders',
                params: {
                    orderNo: '00000101'
                }
            }
        }
    }
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Renders order details', async () => {
    renderWithProviders(<MockedOrderDetails />)
    expect(await screen.findByTestId('account-order-details-page')).toBeInTheDocument()
    expect(await screen.findByText(/order number: 00000101/i)).toBeInTheDocument()
    expect(await screen.findByText(/Simple Product/i)).toBeInTheDocument()
})
