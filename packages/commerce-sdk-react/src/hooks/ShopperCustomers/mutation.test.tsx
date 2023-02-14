/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, createQueryClient, DEFAULT_TEST_HOST} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {
    ShopperCustomersMutationType,
    useShopperCustomersMutation,
    shopperCustomersCacheUpdateMatrix,
    SHOPPER_CUSTOMERS_NOT_IMPLEMENTED
} from './mutation'
import nock from 'nock'
import {QueryKey} from '@tanstack/react-query'
import {QueryKeyMap} from '../utils'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

const CUSTOMER_ID = 'CUSTOMER_ID'
const ADDRESS_NAME = 'ADDRESS_NAME'
const LIST_ID = 'LIST_ID'
const ITEM_ID = 'ITEM_ID'
const PAYMENT_INSTRUMENT_ID = 'PAYMENT_INSTRUMENT_ID'
const PRODUCT_ID = 'PRODUCT_ID'

type MutationPayloads = {
    [key in ShopperCustomersMutationType]?: {body: any; parameters: any}
}

const mutationPayloads: MutationPayloads = {
    updateCustomer: {
        body: {firstName: `Kobe`},
        parameters: {customerId: CUSTOMER_ID}
    },

    createCustomerAddress: {
        body: {addressId: `TestNewAddress`, countryCode: 'CA', lastName: 'Murphy'},
        parameters: {customerId: CUSTOMER_ID}
    },

    updateCustomerAddress: {
        body: {addressId: 'TestAddress', countryCode: 'US', lastName: `Murphy`},
        parameters: {customerId: CUSTOMER_ID, addressName: ADDRESS_NAME}
    },

    removeCustomerAddress: {
        body: {},
        parameters: {customerId: CUSTOMER_ID, addressName: `TestNewAddress`}
    },

    createCustomerProductList: {
        body: {type: 'wish_list'},
        parameters: {customerId: CUSTOMER_ID}
    },

    createCustomerProductListItem: {
        body: {priority: 2, public: true, quantity: 3, type: 'product', productId: PRODUCT_ID},
        parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
    },

    updateCustomerProductListItem: {
        body: {priority: 2, public: true, quantity: 13},
        parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
    },

    deleteCustomerProductListItem: {
        body: {},
        parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
    },

    createCustomerPaymentInstrument: {
        body: {
            bankRoutingNumber: 'AB1234',
            giftCertificateCode: 'gift-code',
            paymentCard: {
                number: '4454852652415965',
                validFromMonth: 12,
                expirationYear: 2030,
                expirationMonth: 12,
                cardType: 'Visa',
                holder: 'John Smith',
                issueNumber: '92743928',
                validFromYear: 22
            },
            paymentMethodId: 'Credit Card'
        },
        parameters: {customerId: CUSTOMER_ID}
    },
    deleteCustomerPaymentInstrument: {
        body: {},
        parameters: {customerId: CUSTOMER_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
    }
}

interface CustomerMutationComponentParams {
    action: ShopperCustomersMutationType
}
const CustomerMutationComponent = ({action}: CustomerMutationComponentParams) => {
    const mutationHook = useShopperCustomersMutation({action})

    return (
        <>
            <div>
                <button onClick={() => mutationHook.mutate(mutationPayloads[action])}>
                    {action}
                </button>
                {mutationHook.error?.message && (
                    <p style={{color: 'red'}}>Error: {mutationHook.error?.message}</p>
                )}
                <hr />
                {mutationHook.isSuccess && <span>isSuccess</span>}
            </div>
        </>
    )
}

const tests = (Object.keys(mutationPayloads) as ShopperCustomersMutationType[]).map(
    (mutationName) => {
        return {
            hook: mutationName,
            cases: [
                {
                    name: 'success',
                    assertions: async () => {
                        nock(DEFAULT_TEST_HOST)
                            .patch((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(200, {})
                            .put((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(200, {})
                            .post((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(200, {})
                            .delete((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(204, {})

                        const queryClient = createQueryClient()

                        renderWithProviders(
                            <CustomerMutationComponent
                                action={mutationName as ShopperCustomersMutationType}
                            />,
                            {
                                queryClient
                            }
                        )
                        await waitFor(() =>
                            screen.getByRole('button', {
                                name: mutationName
                            })
                        )

                        const mutation: any = shopperCustomersCacheUpdateMatrix[mutationName]

                        // Pre-populate cache with query keys we invalidate/update/remove onSuccess
                        const {invalidate, update, remove} = mutation(
                            mutationPayloads[mutationName],
                            {}
                        )

                        const queryKeys = [
                            ...(invalidate || []),
                            ...(update || []),
                            ...(remove || [])
                        ]

                        queryKeys.forEach(({key: queryKey}: QueryKeyMap) => {
                            queryClient.setQueryData(queryKey, () => ({test: true}))
                        })

                        const button = screen.getByRole('button', {
                            name: mutationName
                        })

                        fireEvent.click(button)
                        await waitFor(() => screen.getByText(/isSuccess/i))
                        expect(screen.getByText(/isSuccess/i)).toBeInTheDocument()

                        // Assert changes in cache
                        update?.forEach(({key: queryKey}: QueryKeyMap) => {
                            expect(queryClient.getQueryData(queryKey)).not.toEqual({test: true})
                        })
                        invalidate?.forEach(({key: queryKey}: QueryKeyMap) => {
                            expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeTruthy()
                        })
                        remove?.forEach(({key: queryKey}: QueryKeyMap) => {
                            expect(queryClient.getQueryState(queryKey)).toBeFalsy()
                        })
                    }
                },
                {
                    name: 'error',
                    assertions: async () => {
                        nock(DEFAULT_TEST_HOST)
                            .patch((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(500, {})
                            .put((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(500, {})
                            .post((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(500, {})
                            .delete((uri) => {
                                return uri.includes('/customer/shopper-customers/')
                            })
                            .reply(500, {})

                        renderWithProviders(
                            <CustomerMutationComponent
                                action={mutationName as ShopperCustomersMutationType}
                            />
                        )
                        await waitFor(() =>
                            screen.getByRole('button', {
                                name: mutationName
                            })
                        )

                        const button = screen.getByRole('button', {
                            name: mutationName
                        })

                        fireEvent.click(button)
                        await waitFor(() => screen.getByText(/error/i))
                        expect(screen.getByText(/error/i)).toBeInTheDocument()
                    }
                }
            ]
        }
    }
)

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})

test.each(SHOPPER_CUSTOMERS_NOT_IMPLEMENTED)(
    '%j - throws error when not implemented',
    (methodName) => {
        const action = methodName as ShopperCustomersMutationType
        expect(() => {
            useShopperCustomersMutation({action})
        }).toThrowError('This method is not implemented.')
    }
)
