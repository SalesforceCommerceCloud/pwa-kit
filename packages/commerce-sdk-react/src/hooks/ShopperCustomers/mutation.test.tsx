/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockAuthCalls, queryClient, renderWithProviders} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {ShopperCustomersMutationType, useShopperCustomersMutation} from './mutation'
import nock from 'nock'
import {QueryKey} from '@tanstack/react-query'

const CUSTOMER_EMAIL = 'kobe@test.com'
const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const ADDRESS_NAME = 'TestAddress'
const LIST_ID = 'bcd08be6f883120b4960ca8a0b'
const ITEM_ID = '60ee899e9305de0df5b0fcade5'
const PAYMENT_INSTRUMENT_ID = '060e03df91c98e72c21086e0e2'
const PRODUCT_ID = '25518823M'

const hooksDetails = {
    updateCustomer: {
        args: {
            body: {firstName: `Kobe`},
            parameters: {customerId: CUSTOMER_ID}
        },
        update: [['/customers', CUSTOMER_ID, {customerId: CUSTOMER_ID}]],
        invalidate: [
            ['/customers', CUSTOMER_ID, '/payment-instruments'],
            ['/customers', CUSTOMER_ID, '/addresses'],
            ['/customers', '/external-profile']
        ]
    },

    createCustomerAddress: {
        args: {
            body: {addressId: `TestNewAddress`, countryCode: 'CA', lastName: 'Murphy'},
            parameters: {customerId: CUSTOMER_ID}
        },
        update: [
            [
                '/customers',
                CUSTOMER_ID,
                '/addresses',
                {addressName: `TestNewAddress`, customerId: CUSTOMER_ID}
            ]
        ],
        invalidate: [['/customers', CUSTOMER_ID, {customerId: CUSTOMER_ID}]]
    },

    updateCustomerAddress: {
        args: {
            body: {addressId: 'TestAddress', countryCode: 'US', lastName: `Murphy`},
            parameters: {customerId: CUSTOMER_ID, addressName: ADDRESS_NAME}
        },
        update: [
            [
                '/customers',
                CUSTOMER_ID,
                '/addresses',
                {addressName: ADDRESS_NAME, customerId: CUSTOMER_ID}
            ]
        ],
        invalidate: [['/customers', CUSTOMER_ID, {customerId: CUSTOMER_ID}]]
    },

    removeCustomerAddress: {
        args: {
            body: {},
            parameters: {customerId: CUSTOMER_ID, addressName: `TestNewAddress`}
        },
        invalidate: [['/customers', CUSTOMER_ID, {customerId: CUSTOMER_ID}]],
        remove: [
            [
                '/customers',
                CUSTOMER_ID,
                '/addresses',
                {addressName: `TestNewAddress`, customerId: CUSTOMER_ID}
            ]
        ]
    },

    createCustomerProductList: {
        args: {
            body: {type: 'wish_list'},
            parameters: {customerId: CUSTOMER_ID}
        },
        update: [
            ['/customers', CUSTOMER_ID, '/product-list', {customerId: CUSTOMER_ID, listId: LIST_ID}]
        ]
    },

    createCustomerProductListItem: {
        args: {
            body: {priority: 2, public: true, quantity: 3, type: 'product', productId: PRODUCT_ID},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
        },
        update: [['/customers', CUSTOMER_ID, '/product-list', LIST_ID, {itemId: ITEM_ID}]],
        invalidate: [
            ['/customers', CUSTOMER_ID, '/product-list', {customerId: CUSTOMER_ID, listId: LIST_ID}]
        ]
    },

    updateCustomerProductListItem: {
        args: {
            body: {priority: 2, public: true, quantity: 13},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
        },
        update: [['/customers', CUSTOMER_ID, '/product-list', LIST_ID, {itemId: ITEM_ID}]],
        invalidate: [
            ['/customers', CUSTOMER_ID, '/product-list', {customerId: CUSTOMER_ID, listId: LIST_ID}]
        ]
    },

    deleteCustomerProductListItem: {
        args: {
            body: {},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
        },
        invalidate: [
            ['/customers', CUSTOMER_ID, '/product-list', {customerId: CUSTOMER_ID, listId: LIST_ID}]
        ],
        remove: [['/customers', CUSTOMER_ID, '/product-list', LIST_ID, {itemId: ITEM_ID}]]
    },

    createCustomerPaymentInstrument: {
        args: {
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
        update: [
            [
                '/customers',
                CUSTOMER_ID,
                '/payment-instruments',
                {customerId: CUSTOMER_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
            ]
        ],
        invalidate: [['/customers', CUSTOMER_ID, {customerId: CUSTOMER_ID}]]
    },
    deleteCustomerPaymentInstrument: {
        args: {
            body: {},
            parameters: {customerId: CUSTOMER_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
        },
        invalidate: [['/customers', CUSTOMER_ID, {customerId: CUSTOMER_ID}]],
        remove: [
            [
                '/customers',
                CUSTOMER_ID,
                '/payment-instruments',
                {customerId: CUSTOMER_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
            ]
        ]
    }
}

interface CustomerMutationComponentParams {
    action: ShopperCustomersMutationType
}

const CustomerMutationComponent = ({action}: CustomerMutationComponentParams) => {
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    const mutationHook = useShopperCustomersMutation(action)
    // @ts-ignore
    const {args} = hooksDetails[action]

    return (
        <>
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
            <div>
                <button onClick={() => mutationHook.mutate(args)}>{action}</button>
                {mutationHook.error?.message && (
                    <p style={{color: 'red'}}>Error: {mutationHook.error?.message}</p>
                )}
                <hr />
                {mutationHook.isSuccess && <span>isSuccess</span>}
            </div>
        </>
    )
}

const tests = Object.keys(hooksDetails).map((key) => {
    return {
        hook: key,
        cases: [
            {
                name: 'success',
                assertions: async () => {
                    mockAuthCalls()

                    // Mock server responses
                    const mockReplyBody = {
                        customerId: CUSTOMER_ID,
                        email: CUSTOMER_EMAIL,
                        login: CUSTOMER_EMAIL,
                        listId: LIST_ID,
                        itemId: ITEM_ID,
                        paymentInstrumentId: PAYMENT_INSTRUMENT_ID
                    }

                    nock('http://localhost:3000')
                        .patch((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(200, mockReplyBody)
                    nock('http://localhost:3000')
                        .put((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(200, mockReplyBody)
                    nock('http://localhost:3000')
                        .post((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(200, mockReplyBody)
                    nock('http://localhost:3000')
                        .delete((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(204, {})

                    renderWithProviders(
                        <CustomerMutationComponent action={key as ShopperCustomersMutationType} />
                    )
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: key
                        })
                    )

                    // Pre-populate cache with query keys we invalidate/update/remove onSuccess
                    // @ts-ignore
                    const {invalidate, update, remove} = hooksDetails[key]
                    invalidate?.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {})
                    })
                    update?.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {})
                    })
                    remove?.forEach((queryKey: QueryKey) => {
                        queryClient.setQueryData(queryKey, {})
                    })

                    const button = screen.getByRole('button', {
                        name: key
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/isSuccess/i))
                    expect(screen.getByText(/isSuccess/i)).toBeInTheDocument()

                    // Assert changes in cache
                    update?.forEach((queryKey: QueryKey) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
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
                    mockAuthCalls()
                    renderWithProviders(
                        <CustomerMutationComponent action={key as ShopperCustomersMutationType} />
                    )
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: key
                        })
                    )

                    // Mock server responses
                    nock('http://localhost:3000')
                        .patch((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(500, {})
                    nock('http://localhost:3000')
                        .put((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(500, {})
                    nock('http://localhost:3000')
                        .post((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(500, {})
                    nock('http://localhost:3000')
                        .delete((uri) => {
                            return uri.includes('/customer/shopper-customers/')
                        })
                        .reply(500, {})

                    const button = screen.getByRole('button', {
                        name: key
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
            queryClient.clear()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
