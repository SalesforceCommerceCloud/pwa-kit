/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {renderWithProviders, setupMockServer, createPathWithDefaults} from '../../utils/test-utils'
import Confirmation from './confirmation'
import {keysToCamel} from '../../commerce-api/utils'
import useBasket from '../../commerce-api/hooks/useBasket'
import useShopper from '../../commerce-api/hooks/useShopper'
import {ocapiOrderResponse} from '../../commerce-api/mock-data'
import {mockedGuestCustomer, exampleTokenReponse} from '../../commerce-api/mock-data'

jest.mock('../../commerce-api/hooks/useCustomer', () => {
    const originalModule = jest.requireActual('../../commerce-api/hooks/useCustomer')
    const useCustomer = originalModule.default

    console.log('--- mock useCustomer to force log in as guest')
    return () => {
        const customer = useCustomer()
        const _login = customer.login

        customer.login = () => {
            // Testing becomes easier if we have to deal with only guest login
            return _login()
        }

        return customer
    }
})

const mockOrder = keysToCamel({
    basket_id: 'testorderbasket',
    ...ocapiOrderResponse
})

const mockBasketOrder = {
    baskets: [mockOrder]
}

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async getCustomer() {
                return {
                    authType: 'guest',
                    customerId: 'customerid'
                }
            }

            async authorizeCustomer() {
                return {
                    headers: {
                        get(key) {
                            return {authorization: 'guestToken'}[key]
                        }
                    },
                    json: async () => ({
                        authType: 'guest',
                        customerId: 'customerid'
                    })
                }
            }

            async getCustomerBaskets() {
                return mockBasketOrder
            }
        },
        ShopperProducts: class ShopperProductsMock extends sdk.ShopperProducts {
            async getProducts() {
                return {
                    data: [
                        {
                            id: 'SimpleProduct',
                            currency: 'USD',

                            imageGroups: [
                                {
                                    images: [
                                        {
                                            alt: 'alttext',
                                            disBaseLink: '/image',
                                            link: '/image',
                                            title: 'simpleproduct'
                                        }
                                    ],
                                    viewType: 'small'
                                }
                            ],
                            name: 'Simple Product',

                            price: 46.99,

                            variationAttributes: [
                                {
                                    id: 'color',
                                    name: 'Color',
                                    values: [
                                        {
                                            name: 'Grey Heather Multi',
                                            orderable: true,
                                            value: 'JJ1MCE6'
                                        },
                                        {
                                            name: 'Begonia Multi',
                                            orderable: true,
                                            value: 'JJHL3XX'
                                        }
                                    ]
                                },
                                {
                                    id: 'size',
                                    name: 'Size',
                                    values: [
                                        {
                                            name: 'S',
                                            orderable: true,
                                            value: '9SM'
                                        },
                                        {
                                            name: 'M',
                                            orderable: true,
                                            value: '9MD'
                                        },
                                        {
                                            name: 'L',
                                            orderable: true,
                                            value: '9LG'
                                        },
                                        {
                                            name: 'XL',
                                            orderable: true,
                                            value: '9XL'
                                        }
                                    ]
                                }
                            ],
                            variationValues: {
                                color: 'JJ1MCE6',
                                size: '9MD'
                            }
                        }
                    ]
                }
            }
        }
    }
})

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const WrappedConfirmation = () => {
    useShopper()
    const basket = useBasket()
    if (basket?._type !== 'order') {
        return null
    }

    return <Confirmation />
}

const server = setupMockServer(
    rest.get('*/baskets*', (_, res, ctx) => {
        return res(ctx.json(keysToCamel(mockBasketOrder)))
    }),

    rest.post('*/customers/actions/login', (_, res, ctx) => {
        return res(
            ctx.json(mockedGuestCustomer),
            ctx.set('Authorization', exampleTokenReponse.access_token)
        )
    }),

    rest.post('*/customers', (_, res, ctx) => {
        const successfulAccountCreation = {
            authType: 'registered',
            creationDate: '2021-05-03T07:04:56.566Z',
            customerId: 'abQfkJHegtUQfaCBRL5AjuTKY7',
            customerNo: '00154003',
            email: 'test3@foo.com',
            enabled: true,
            firstName: 'John',
            lastModified: '2021-05-03T07:04:56.572Z',
            lastName: 'Smith',
            login: 'test3@foo.com'
        }
        return res(ctx.json(successfulAccountCreation))
    })
)

// Set up and clean up
beforeAll(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
})
afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    server.resetHandlers()
    window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
})
afterAll(() => server.close())

test('Navigates to homepage when no order present', async () => {
    renderWithProviders(<Confirmation />)
    expect(screen.queryByTestId('sf-checkout-confirmation-container')).not.toBeInTheDocument()
    await waitFor(() => {
        expect(window.location.pathname).toEqual('/')
    })
})

test('Renders the order detail when present', async () => {
    renderWithProviders(<WrappedConfirmation />)

    const rootEl = await screen.findByTestId(
        'sf-checkout-confirmation-container',
        {},
        {timeout: 15000}
    )

    expect(rootEl).toBeInTheDocument()
})

test('Renders the Create Account form for guest customer', async () => {
    renderWithProviders(<WrappedConfirmation />)

    const button = await screen.findByRole('button', {name: /create account/i})
    expect(button).toBeInTheDocument()

    // Email should already have been auto-filled
    const email = screen.getByDisplayValue('jeff@lebowski.com')
    expect(email).toBeInTheDocument()

    const password = screen.getByLabelText('Password')
    expect(password).toBeInTheDocument()
})

test('Create Account form - renders error message', async () => {
    server.use(
        rest.post('*/customers', (_, res, ctx) => {
            const failedAccountCreation = {
                title: 'Login Already In Use',
                type:
                    'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/login-already-in-use',
                detail: 'The login is already in use.'
            }
            return res(ctx.json(failedAccountCreation))
        })
    )

    renderWithProviders(<WrappedConfirmation />)

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const password = screen.getByLabelText('Password')

    user.type(password, 'P4ssword!')
    user.click(createAccountButton)

    const alert = await screen.findByRole('alert', {}, {timeout: 2000})
    expect(alert).toBeInTheDocument()
})

test('Create Account form - successful submission results in redirect to the Account page', async () => {
    renderWithProviders(<WrappedConfirmation />)

    const createAccountButton = await screen.findByRole('button', {name: /create account/i})
    const password = screen.getByLabelText('Password')

    user.type(password, 'P4ssword!')
    user.click(createAccountButton)

    await waitFor(() => {
        expect(window.location.pathname).toEqual('/uk/en-GB/account')
    })
})
