/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout/partials/contact-info'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import {scapiBasketWithItem} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    mockGoToStep,
    mockGoToNextStep
} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'

const invalidEmail = 'invalidEmail'
const validEmail = 'test@salesforce.com'
const password = 'abc123'
const mockAuthHelperFunctions = {
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()},
    [AuthHelpers.AuthorizePasswordless]: {mutateAsync: jest.fn()}
}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest
            .fn()
            .mockImplementation((helperType) => mockAuthHelperFunctions[helperType])
    }
})

jest.mock('../util/checkout-context', () => {
    const mockGoToStep = jest.fn()
    const mockGoToNextStep = jest.fn()
    const MOCK_STEPS = {CONTACT_INFO: 0, PAYMENT: 2}
    return {
        __esModule: true,
        // expose for tests
        mockGoToStep,
        mockGoToNextStep,
        MOCK_STEPS,
        useCheckout: jest.fn().mockReturnValue({
            customer: null,
            basket: {},
            isGuestCheckout: true,
            setIsGuestCheckout: jest.fn(),
            step: 0,
            login: null,
            STEPS: MOCK_STEPS,
            goToStep: mockGoToStep,
            goToNextStep: mockGoToNextStep
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => {
    const defaultReturn = {data: {}, derivedData: {totalItems: 0}}
    return {
        __esModule: true,
        useCurrentBasket: jest.fn().mockReturnValue(defaultReturn)
    }
})

afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
})

describe('passwordless and social disabled', () => {
    test('renders component', async () => {
        const {user} = renderWithProviders(
            <ContactInfo isPasswordlessEnabled={false} isSocialEnabled={false} />
        )

        // switch to login
        const trigger = screen.getByText(/Already have an account\? Log in/i)
        await user.click(trigger)

        // open forgot password modal
        const withinCard = within(screen.getByTestId('sf-toggle-card-step-0'))
        const openModal = withinCard.getByText(/Forgot password\?/i)
        await user.click(openModal)

        // check that forgot password modal is open
        const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
        expect(withinForm.getByText(/Reset Password/i)).toBeInTheDocument()
    })

    test('does not allow login if email or password is missing', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        // switch to login
        const trigger = screen.getByText(/Already have an account\? Log in/i)
        await user.click(trigger)

        // attempt to login
        const loginButton = screen.getByText('Log In')
        await user.click(loginButton)
        expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
        expect(screen.getByText('Please enter your password.')).toBeInTheDocument()
    })

    test('allows login', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        // switch to login
        const trigger = screen.getByText(/Already have an account\? Log in/i)
        await user.click(trigger)

        // enter email address and password
        await user.type(screen.getByLabelText('Email'), validEmail)
        await user.type(screen.getByLabelText('Password'), password)

        const loginButton = screen.getByText('Log In')
        await user.click(loginButton)
        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginRegisteredUserB2C].mutateAsync
        ).toHaveBeenCalledWith({username: validEmail, password: password})
    })
})

describe('passwordless enabled', () => {
    let currentBasket = JSON.parse(JSON.stringify(scapiBasketWithItem))

    beforeEach(() => {
        global.server.use(
            rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
                currentBasket.customerInfo.email = validEmail
                return res(ctx.json(currentBasket))
            })
        )
        // Provide basket with basketId and items for tests in this suite
        useCurrentBasket.mockReturnValue({
            data: currentBasket,
            derivedData: {totalItems: currentBasket.productItems?.length || 0}
        })
    })

    test('renders component', async () => {
        const {getByRole} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)
        expect(getByRole('button', {name: 'Checkout as Guest'})).toBeInTheDocument()
        expect(getByRole('button', {name: 'Secure Link'})).toBeInTheDocument()
        expect(getByRole('button', {name: 'Password'})).toBeInTheDocument()
    })

    test('does not allow login if email is missing', async () => {
        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // Click passwordless login button
        const passwordlessLoginButton = screen.getByText('Secure Link')
        await user.click(passwordlessLoginButton)
        expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()

        // Click password login button
        const passwordLoginButton = screen.getByText('Password')
        await user.click(passwordLoginButton)
        expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
    })

    test('does not allow passwordless login if email is invalid', async () => {
        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // enter an invalid email address
        await user.type(screen.getByLabelText('Email'), invalidEmail)

        const passwordlessLoginButton = screen.getByText('Secure Link')
        await user.click(passwordlessLoginButton)
        expect(screen.queryByTestId('sf-form-resend-passwordless-email')).not.toBeInTheDocument()
    })

    test('allows passwordless login', async () => {
        jest.spyOn(window, 'location', 'get').mockReturnValue({
            pathname: '/checkout',
            origin: 'https://example.com'
        })

        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // initiate passwordless login
        const passwordlessLoginButton = screen.getByText('Secure Link')
        await user.click(passwordlessLoginButton)
        expect(
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync
        ).toHaveBeenCalledWith({
            userid: validEmail,
            callbackURI:
                'https://webhook.site/27761b71-50c1-4097-a600-21a3b89a546c?redirectUrl=/checkout'
        })

        // check that check email modal is open
        await waitFor(() => {
            const withinForm = within(screen.getByTestId('sf-form-resend-passwordless-email'))
            expect(withinForm.getByText(/Check Your Email/i)).toBeInTheDocument()
            expect(withinForm.getByText(validEmail)).toBeInTheDocument()
        })

        // resend the email
        await user.click(screen.getByText(/Resend Link/i))
        expect(
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync
        ).toHaveBeenCalledWith({
            userid: validEmail,
            callbackURI:
                'https://webhook.site/27761b71-50c1-4097-a600-21a3b89a546c?redirectUrl=/checkout'
        })
    })

    test('allows login using password', async () => {
        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // initiate login using password
        const passwordButton = screen.getByText('Password')
        await user.click(passwordButton)

        // enter a password
        await user.type(screen.getByLabelText('Password'), password)

        const loginButton = screen.getByText('Log In')
        await user.click(loginButton)
        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginRegisteredUserB2C].mutateAsync
        ).toHaveBeenCalledWith({username: validEmail, password: password})
    })

    test.each([
        [
            "callback_uri doesn't match the registered callbacks",
            'This feature is not currently available.'
        ],
        [
            'PasswordLess Permissions Error for clientId:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'This feature is not currently available.'
        ],
        ['client secret is not provided', 'This feature is not currently available.'],
        ['unexpected error message', 'Something went wrong. Try again!']
    ])(
        'maps API error "%s" to the displayed error message"%s"',
        async (apiErrorMessage, expectedMessage) => {
            mockAuthHelperFunctions[
                AuthHelpers.AuthorizePasswordless
            ].mutateAsync.mockImplementation(() => {
                throw new Error(apiErrorMessage)
            })
            const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)
            await user.type(screen.getByLabelText('Email'), validEmail)
            const passwordlessLoginButton = screen.getByText('Secure Link')
            // Click the button twice as the isPasswordlessLoginClicked state doesn't change after the first click
            await user.click(passwordlessLoginButton)
            await user.click(passwordlessLoginButton)
            await waitFor(() => {
                expect(screen.getByText(expectedMessage)).toBeInTheDocument()
            })
        }
    )

    test('allows guest checkout via Enter key', async () => {
        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // submit via Enter key - should trigger guest checkout
        await user.keyboard('{Enter}')

        // should update customer info for basket (guest checkout)
        await waitFor(() => {
            expect(currentBasket.customerInfo.email).toBe(validEmail)
        })
    })

    test('allows login via Enter key when password is provided', async () => {
        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // switch to password mode
        const passwordButton = screen.getByText('Password')
        await user.click(passwordButton)

        // enter password
        await user.type(screen.getByLabelText('Password'), password)

        // submit via Enter key - should trigger login
        await user.keyboard('{Enter}')

        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginRegisteredUserB2C].mutateAsync
        ).toHaveBeenCalledWith({username: validEmail, password: password})
    })
})

describe('social login enabled', () => {
    test('renders component', async () => {
        const {getByRole} = renderWithProviders(
            <ContactInfo isSocialEnabled={true} idps={['google']} />
        )
        expect(getByRole('button', {name: 'Checkout as Guest'})).toBeInTheDocument()
        expect(getByRole('button', {name: 'Password'})).toBeInTheDocument()
        expect(getByRole('button', {name: /Google/i})).toBeInTheDocument()
    })
})

describe('navigation based on shipment context', () => {
    // using named imports from the mocked module

    beforeEach(() => {
        mockGoToStep.mockClear()
        mockGoToNextStep.mockClear()
        useCurrentBasket.mockReset()
    })

    test('skips to payment when all items are pickup at one store', async () => {
        // Basket with a single pickup shipment and no delivery shipments
        useCurrentBasket.mockReturnValue({
            data: {
                shipments: [{shipmentId: 'pickup-1', shippingMethod: {c_storePickupEnabled: true}}],
                // empty items still satisfy the condition since every([]) === true
                productItems: []
            },
            derivedData: {totalItems: 0}
        })

        const {user} = renderWithProviders(<ContactInfo />)

        // switch to login mode
        const trigger = screen.getByText(/Already have an account\? Log in/i)
        await user.click(trigger)

        await user.type(screen.getByLabelText('Email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password')

        await user.click(screen.getByText('Log In'))

        expect(mockGoToNextStep).toHaveBeenCalled()
        expect(mockGoToStep).not.toHaveBeenCalled()
    })

    test('goes to next step when shipments are mixed (delivery present)', async () => {
        // Basket with one pickup and one delivery shipment
        useCurrentBasket.mockReturnValue({
            data: {
                shipments: [
                    {shipmentId: 'pickup-1', shippingMethod: {c_storePickupEnabled: true}},
                    {shipmentId: 'delivery-1', shippingMethod: {c_storePickupEnabled: false}}
                ],
                productItems: []
            },
            derivedData: {totalItems: 0}
        })

        const {user} = renderWithProviders(<ContactInfo />)

        // switch to login mode
        const trigger = screen.getByText(/Already have an account\? Log in/i)
        await user.click(trigger)

        await user.type(screen.getByLabelText('Email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password')

        await user.click(screen.getByText('Log In'))

        expect(mockGoToNextStep).toHaveBeenCalled()
        expect(mockGoToStep).not.toHaveBeenCalled()
    })
})
