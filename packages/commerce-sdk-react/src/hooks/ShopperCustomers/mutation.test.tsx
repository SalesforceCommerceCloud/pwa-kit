/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import path from 'path'
import {mockHttpResponses, renderWithProviders, queryClient, mockAuthCalls} from '../../test-utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {ShopperLoginHelpers, useShopperLoginHelper} from '../ShopperLogin'
import {useShopperCustomersMutation, ShopperCustomersMutations} from './mutation'
import nock from 'nock'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

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
        update: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                // @ts-ignore
                {customerId: CUSTOMER_ID}
            ]
        ],
        invalidate: [
            // @ts-ignore
            ['/customers', CUSTOMER_ID, '/payment-instruments'],
            // @ts-ignore
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
                // @ts-ignore
                CUSTOMER_ID,
                '/addresses',
                // @ts-ignore
                {
                    // @ts-ignore
                    addressName: `TestNewAddress`,
                    // @ts-ignore
                    customerId: CUSTOMER_ID
                }
            ]
        ],
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                // @ts-ignore
                {customerId: CUSTOMER_ID}
            ]
        ]
    },

    updateCustomerAddress: {
        args: {
            body: {addressId: 'TestAddress', countryCode: 'US', lastName: `Murphy`},
            parameters: {customerId: CUSTOMER_ID, addressName: ADDRESS_NAME}
        },
        update: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/addresses',
                // @ts-ignore
                {
                    // @ts-ignore
                    addressName: ADDRESS_NAME,
                    // @ts-ignore
                    customerId: CUSTOMER_ID
                }
            ]
        ],
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                // @ts-ignore
                {customerId: CUSTOMER_ID}
            ]
        ]
    },

    removeCustomerAddress: {
        args: {
            body: {},
            parameters: {customerId: CUSTOMER_ID, addressName: `TestNewAddress`}
        },
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                // @ts-ignore
                {customerId: CUSTOMER_ID}
            ]
        ],
        remove: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/addresses',
                // @ts-ignore
                {
                    // @ts-ignore
                    addressName: `TestNewAddress`,
                    // @ts-ignore
                    customerId: CUSTOMER_ID
                }
            ]
        ]
    },

    createCustomerProductList: {
        args: {
            body: {type: 'wish_list'},
            parameters: {customerId: CUSTOMER_ID}
        },
        update: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                {customerId: CUSTOMER_ID, listId: LIST_ID}
            ]
        ]
    },

    createCustomerProductListItem: {
        args: {
            body: {priority: 2, public: true, quantity: 3, type: 'product', productId: PRODUCT_ID},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
        },
        update: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                LIST_ID,
                // @ts-ignore
                {
                    itemId: ITEM_ID
                }
            ]
        ],
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                {
                    customerId: CUSTOMER_ID,
                    listId: LIST_ID
                }
            ]
        ]
    },

    updateCustomerProductListItem: {
        args: {
            body: {priority: 2, public: true, quantity: 13},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
        },
        update: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                LIST_ID,
                // @ts-ignore
                {itemId: ITEM_ID}
            ]
        ],
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                {
                    customerId: CUSTOMER_ID,
                    listId: LIST_ID
                }
            ]
        ]
    },

    deleteCustomerProductListItem: {
        args: {
            body: {},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
        },
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                {
                    customerId: CUSTOMER_ID,
                    listId: LIST_ID
                }
            ]
        ],
        remove: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/product-list',
                // @ts-ignore
                LIST_ID,
                // @ts-ignore
                {itemId: ITEM_ID}
            ]
        ]
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
                // @ts-ignore
                CUSTOMER_ID,
                '/payment-instruments',
                // @ts-ignore
                {
                    customerId: CUSTOMER_ID,
                    paymentInstrumentId: PAYMENT_INSTRUMENT_ID
                }
            ]
        ],
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                // @ts-ignore
                {customerId: CUSTOMER_ID}
            ]
        ]
    },
    deleteCustomerPaymentInstrument: {
        args: {
            body: {},
            parameters: {customerId: CUSTOMER_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
        },
        invalidate: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                // @ts-ignore
                {customerId: CUSTOMER_ID}
            ]
        ],
        remove: [
            [
                '/customers',
                // @ts-ignore
                CUSTOMER_ID,
                '/payment-instruments',
                // @ts-ignore
                {
                    customerId: CUSTOMER_ID,
                    paymentInstrumentId: PAYMENT_INSTRUMENT_ID
                }
            ]
        ]
    }
}

// @ts-ignore
const CustomerMutationComponent = ({action}) => {
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    React.useEffect(() => {
        loginRegisteredUser.mutate({
            username: 'kobe@test.com',
            password: 'Test1234!'
        })
    }, [])

    // @ts-ignore
    const mutationHook = useShopperCustomersMutation(action)

    // @ts-ignore
    const args = hooksDetails[action]?.args

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

const tests: {hook: string; cases: {name: string; assertions: () => Promise<void>}[]}[] = []
Object.entries(hooksDetails).forEach(([key]) => {
    tests.push({
        hook: key,
        cases: [
            {
                name: 'success',
                assertions: async () => {

                    mockAuthCalls()

                    // Mock server responses
                    const mockReplyBody={
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

                    renderWithProviders(<CustomerMutationComponent action={key} />)
                    await waitFor(() => screen.getByText(/kobe@test.com/))
                    await waitFor(() =>
                        screen.getByRole('button', {
                            name: key
                        })
                    )

                    // CACHE Pre-populate cache with the query keys we invalidate/update/remove on success
                    // @ts-ignore
                    hooksDetails[key]?.invalidate?.map((queryKey) => {
                        queryClient.setQueryData(queryKey, {})
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
                    })

                    // @ts-ignore
                    hooksDetails[key]?.update?.map((queryKey) => {
                        queryClient.setQueryData(queryKey, {})
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
                    })

                    // @ts-ignore
                    hooksDetails[key]?.remove?.map((queryKey) => {
                        queryClient.setQueryData(queryKey, {})
                        expect(queryClient.getQueryState(queryKey)).toBeTruthy()
                    })

                    // TODO: Remove DEBUG console.log printing queries in cache
                    // console.log('BEFORE cache:',queryClient.getQueryCache().getAll())

                    const button = screen.getByRole('button', {
                        name: key
                    })

                    fireEvent.click(button)
                    await waitFor(() => screen.getByText(/isSuccess/i))
                    expect(screen.getByText(/isSuccess/i)).toBeInTheDocument()
                    // screen.debug(undefined, Infinity)
                    // TODO: Remove DEBUG console.log printing queries in cache
                    // console.log('AFTER cache:',queryClient.getQueryCache().getAll())

                    // CACHE assert updated query keys
                    // @ts-ignore
                    hooksDetails[key]?.update?.map((queryKey) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeFalsy()
                    })

                    // CACHE assert invalidated query keys
                    // @ts-ignore
                    hooksDetails[key]?.invalidate?.map((queryKey) => {
                        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBeTruthy()
                    })

                    // CACHE assert removed query keys
                    // @ts-ignore
                    hooksDetails[key]?.remove?.map((queryKey) => {
                        expect(queryClient.getQueryState(queryKey)).toBeFalsy()
                    })
                }
            }
        ]
    })
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
