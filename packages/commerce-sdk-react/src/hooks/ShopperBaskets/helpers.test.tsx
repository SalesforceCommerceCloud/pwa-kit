/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useShopperBasketsMutationHelper} from './helpers'
import {useCustomerBaskets} from '../ShopperCustomers'
import {renderWithProviders} from '../../test-utils'
import {screen, waitFor} from '@testing-library/react'
import jwt from 'jsonwebtoken'

const basketId = '10cf6aa40edba4fcfcc6915594'
const mockAsyncMutate = jest.fn()

jest.mock('../ShopperCustomers', () => {
    const originalModule = jest.requireActual('../ShopperCustomers')
    return {
        ...originalModule,
        useCustomerBaskets: jest.fn()
    }
})
jest.mock('../index', () => {
    const originalModule = jest.requireActual('./index')
    return {
        ...originalModule,
        useCustomerId: jest.fn(() => 'customer-id')
    }
})

jest.mock('./mutation', () => {
    const originalModule = jest.requireActual('./mutation')
    return {
        ...originalModule,
        useShopperBasketsMutation: () => ({
            mutateAsync: mockAsyncMutate
        })
    }
})
const MockComponent = () => {
    const helpers = useShopperBasketsMutationHelper()
    return (
        <div>
            <button
                onClick={() => {
                    helpers
                        .addItemToNewOrExistingBasket([
                            {
                                productId: 'product-123',
                                price: 100,
                                quantity: 1
                            }
                        ])
                        .catch((e) => console.log('e', e))
                }}
            >
                Add to cart
            </button>
        </div>
    )
}
describe('useShopperBasketsMutationHelper.addItemToNewOrExistingBasket', function () {
    afterEach(() => {
        jest.resetModules()
    })

    test('should perform add to cart mutation when basket is already created', async () => {
        mockAsyncMutate.mockImplementationOnce(() => ({
            productItems: [{id: 'product-id-111', quantity: 20}],
            basketId
        }))
        // @ts-expect-error ts complains because mockImplementation is not part of declared type from useCustomerBaskets queries
        useCustomerBaskets.mockImplementation(() => {
            return {
                data: {total: 1, baskets: [{basketId}]},
                isLoading: false
            }
        })
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usidddddd`,
                isb: `uido:ecom::upn:Guest::uidn:firstname lastname::gcid:customerId::rcid:registeredCid::chid:siteId`
            },
            'secret'
        )
        const {user} = renderWithProviders(<MockComponent />, {
            fetchedToken
        })
        const addToCartBtn = screen.getByText(/add to cart/i)
        await user.click(addToCartBtn)

        await waitFor(() =>
            expect(mockAsyncMutate.mock.calls[0][0]).toEqual({
                parameters: {basketId},
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

    test('should call a basket mutation before calling add to cart mutation', async () => {
        // order is important since mockAsyncMutate will represent createBasket and addToBasket mutation in the order of executions
        mockAsyncMutate
            .mockImplementationOnce(() => ({
                productItems: [],
                basketId
            }))
            .mockImplementationOnce(() => ({
                productItems: [{id: 'product-id', quantity: 2}],
                basketId
            }))
        // @ts-expect-error ts complains because mockImplementation is not part of declared type from useCustomerBaskets queries
        useCustomerBaskets.mockImplementation(() => {
            return {
                data: {total: 0},
                isLoading: false
            }
        })
        const fetchedToken = jwt.sign(
            {
                sub: `cc-slas::zzrf_001::scid:xxxxxx::usid:usidddddd`,
                isb: `uido:ecom::upn:Guest::uidn:firstname lastname::gcid:customerId::rcid:registeredCid::chid:siteId`
            },
            'secret'
        )
        const {user} = renderWithProviders(<MockComponent />, {
            fetchedToken
        })
        const addToCartBtn = screen.getByText(/add to cart/i)
        await user.click(addToCartBtn)
        expect(mockAsyncMutate).toHaveBeenCalledTimes(2)

        await waitFor(() => expect(mockAsyncMutate.mock.calls[0][0]).toEqual({body: {}}))
        await waitFor(() =>
            expect(mockAsyncMutate.mock.calls[1][0]).toEqual({
                parameters: {basketId},
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
})
