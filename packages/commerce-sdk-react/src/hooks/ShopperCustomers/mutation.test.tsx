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
    queryKeysMatrix
} from './mutation'
import nock from 'nock'
import {QueryKey} from '@tanstack/react-query'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'}),
    }))
})

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const ADDRESS_NAME = 'TestAddress'
const LIST_ID = 'bcd08be6f883120b4960ca8a0b'
const ITEM_ID = '60ee899e9305de0df5b0fcade5'
const PAYMENT_INSTRUMENT_ID = '060e03df91c98e72c21086e0e2'
const PRODUCT_ID = '25518823M'

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
    mutation: ShopperCustomersMutationType
}
const CustomerMutationComponent = ({mutation}: CustomerMutationComponentParams) => {
    const mutationHook = useShopperCustomersMutation(mutation)

    return (
        <>
            <div>
                <button onClick={() => mutationHook.mutate(mutationPayloads[mutation])}>
                    {mutation}
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

const tests = (Object.keys(mutationPayloads) as ShopperCustomersMutationType[]).map((mutationName) => {
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
                        <CustomerMutationComponent mutation={mutationName} />,
                        {queryClient}
                    )
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: mutationName
                        })
                    )

                    // Pre-populate cache with query keys we invalidate/update/remove onSuccess
                    const {invalidate, update, remove} = queryKeysMatrix[mutationName](
                        // @ts-ignore
                        mutationPayloads[mutationName],
                        {}
                    )

                    const queryKeys = [...(invalidate || []), ...(update||[]), ...(remove||[])]

                    queryKeys.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {test:true})
                    })

                    const button = screen.getByRole('button', {
                        name: mutationName
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/isSuccess/i))
                    expect(screen.getByText(/isSuccess/i)).toBeInTheDocument()

                    // Assert changes in cache
                    update?.forEach((queryKey: QueryKey) => {
                        expect(queryClient.getQueryData(queryKey)).not.toEqual({test:true})
                    })
                    invalidate?.forEach((queryKey: QueryKey) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeTruthy()
                    })
                    remove?.forEach((queryKey: QueryKey) => {
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
                        <CustomerMutationComponent mutation={mutationName} />
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
})

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
