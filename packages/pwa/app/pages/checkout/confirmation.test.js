/* eslint-disable no-unused-vars */
import React, {useEffect} from 'react'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../../utils/test-utils'
import Confirmation from './confirmation'
import {keysToCamel} from '../../commerce-api/utils'
import useBasket from '../../commerce-api/hooks/useBasket'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {mockedGuestCustomer, expiredAuthToken} from '../../commerce-api/mock-data'

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

const mockOrder = {
    _type: 'order',
    adjusted_merchandize_total_tax: 0.05,
    adjusted_shipping_total_tax: 0.0,
    billing_address: {
        city: 'Boston',
        country_code: 'US',
        first_name: 'Jeff',
        full_name: 'Jeff Lebowski',
        last_name: 'Lebowski'
    },
    currency: 'USD',
    customer_info: {
        customer_no: 'jlebowski',
        email: 'jeff@lebowski.com'
    },
    merchandize_total_tax: 5.0,
    order_no: '00000101',
    order_total: 1.06,
    payment_instruments: [
        {
            amount: 1.0,
            payment_card: {
                card_type: 'testVisa',
                credit_card_expired: false,
                expiration_month: 4,
                expiration_year: 21.2,
                holder: 'TestPerson',
                number_last_digits: 'mber',
                number_masked: '**********mber'
            },
            payment_method_id: 'CREDIT_CARD'
        }
    ],
    product_items: [
        {
            adjusted_tax: 5.0,
            base_price: 16.49,
            bonus_product_line_item: false,
            item_text: 'Simple Product',
            price: 16.49,
            price_after_item_discount: 16.49,
            price_after_order_discount: 1.0,
            product_id: 'SimpleProduct',
            product_name: 'Simple Product',
            quantity: 1.0,
            tax: 5.0,
            tax_basis: 16.49,
            tax_class_id: null,
            tax_rate: 0.05,
            item_id: 'cdHBEiWbNV9ZcaaadhrCk35gtp',
            c_strValue: 'Test'
        }
    ],
    product_sub_total: 16.49,
    product_total: 1.0,
    shipments: [
        {
            id: 'me',
            shipping_address: {
                city: 'Boston',
                country_code: 'US',
                first_name: 'Jeff',
                full_name: 'Jeff Lebowski',
                last_name: 'Lebowski',
                c_strValue: 'cTest'
            },
            shipping_method: {
                description: 'The base shipping method.',
                id: 'BaseShippingMethod',
                name: 'Base Shipping Method',
                price: 0.01,
                c_somestring: 'ShippingMethod String Value'
            }
        }
    ],
    shipping_items: [
        {
            adjusted_tax: 0.0,
            base_price: 0.01,
            item_text: 'Shipping',
            price: 0.01,
            price_after_item_discount: 0.01,
            shipment_id: 'me',
            tax: 0.0,
            tax_basis: 0.01,
            tax_class_id: 'DefaultTaxClass',
            tax_rate: 0.05,
            item_id: 'devgoiWbNVc92aaadhrSk35gtp'
        }
    ],
    shipping_total: 0.01,
    shipping_total_tax: 0.0,
    status: 'created',
    tax_total: 0.05
}

const mockBasketOrder = {
    baskets: [mockOrder]
}

const WrappedConfirmation = () => {
    const basket = useBasket()
    const customer = useCustomer()

    useEffect(() => {
        basket.getOrCreateBasket()
        customer.login()
    }, [])

    return basket._type === 'order' ? <Confirmation /> : null
}

Object.defineProperty(window, 'fetch', {
    value: require('node-fetch')
})

const server = setupServer(
    rest.get('*/baskets*', (_, res, ctx) => {
        return res(ctx.json(keysToCamel(mockBasketOrder)))
    }),

    rest.post('*/customers/actions/login', (_, res, ctx) => {
        return res(ctx.json(mockedGuestCustomer), ctx.set('Authorization', expiredAuthToken))
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

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('Renders null when no order data is loaded', async () => {
    renderWithProviders(<Confirmation />)
    expect(screen.queryByTestId('sf-checkout-confirmation-container')).not.toBeInTheDocument()
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
        expect(window.location.pathname).toEqual('/en/account')
    })
})
