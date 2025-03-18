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
    return {
        useCheckout: jest.fn().mockReturnValue({
            customer: null,
            basket: {},
            isGuestCheckout: true,
            setIsGuestCheckout: jest.fn(),
            step: 0,
            login: null,
            STEPS: {CONTACT_INFO: 0},
            goToStep: null,
            goToNextStep: jest.fn()
        })
    }
})

afterEach(() => {
    jest.resetModules()
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
            pathname: '/checkout'
        })
        const {user} = renderWithProviders(<ContactInfo isPasswordlessEnabled={true} />)

        // enter a valid email address
        await user.type(screen.getByLabelText('Email'), validEmail)

        // initiate passwordless login
        const passwordlessLoginButton = screen.getByText('Secure Link')
        // Click the button twice as the isPasswordlessLoginClicked state doesn't change after the first click
        await user.click(passwordlessLoginButton)
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
        user.click(screen.getByText(/Resend Link/i))
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
            'User not found',
            'This feature is not currently available. You must create an account to access this feature.'
        ],
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
