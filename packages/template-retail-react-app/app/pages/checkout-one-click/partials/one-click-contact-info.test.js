/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, fireEvent} from '@testing-library/react'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'

const validEmail = 'test@salesforce.com'
const invalidEmail = 'invalidEmail'
const mockAuthHelperFunctions = {
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()},
    [AuthHelpers.Logout]: {mutateAsync: jest.fn()},
    [AuthHelpers.AuthorizePasswordless]: {mutateAsync: jest.fn()},
    [AuthHelpers.LoginPasswordlessUser]: {mutateAsync: jest.fn()}
}

const mockUpdateCustomerForBasket = {mutateAsync: jest.fn()}
const mockMergeBasket = {mutate: jest.fn()}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest
            .fn()
            .mockImplementation((helperType) => mockAuthHelperFunctions[helperType]),
        useShopperBasketsMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateCustomerForBasket') return mockUpdateCustomerForBasket
            if (mutationType === 'mergeBasket') return mockMergeBasket
            return {mutate: jest.fn()}
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({
        data: {
            basketId: 'test-basket-id',
            customerInfo: {
                email: null
            }
        },
        derivedData: {
            hasBasket: true,
            totalItems: 1
        }
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            email: null,
            isRegistered: false
        }
    })
}))

jest.mock('@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context', () => {
    return {
        useCheckout: jest.fn().mockReturnValue({
            customer: null,
            basket: {basketId: 'test-basket-id'},
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

beforeEach(() => {
    jest.clearAllMocks()
})

afterEach(() => {
    jest.resetModules()
})

describe('ContactInfo Component', () => {
    beforeEach(() => {
        global.server.use(
            rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
                return res(
                    ctx.json({
                        basketId: 'test-basket-id',
                        customerInfo: {email: validEmail}
                    })
                )
            })
        )
    })

    test('renders basic component structure', () => {
        renderWithProviders(<ContactInfo />)

        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByText('Contact Info')).toBeInTheDocument()
    })

    test('renders email input field', () => {
        renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('type', 'email')
    })

    test('shows social login when enabled', () => {
        renderWithProviders(<ContactInfo isSocialEnabled={true} idps={['google', 'apple']} />)

        expect(screen.getByText('Or Login With')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Google/i})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /Apple/i})).toBeInTheDocument()
    })

    test('does not show social login when disabled', () => {
        renderWithProviders(<ContactInfo isSocialEnabled={false} />)

        expect(screen.queryByText('Or Login With')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /Google/i})).not.toBeInTheDocument()
    })

    test('validates email is required', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        // Submit form without entering email
        await user.type(emailInput, '{enter}')

        expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
    })

    test('accepts any text input for email field', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, invalidEmail)

        // The simplified component doesn't validate email format, so invalid email should be accepted
        expect(emailInput).toHaveValue(invalidEmail)
    })

    test('shows continue button for unregistered email', async () => {
        // Mock the passwordless login to fail (email not found)
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockRejectedValue(
            new Error('Email not found')
        )

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        await waitFor(() => {
            expect(screen.getByText('Continue to Shipping Address')).toBeInTheDocument()
        })
    })

    test('opens OTP modal for registered email on blur', async () => {
        // Mock successful passwordless login authorization
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({
            success: true
        })

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        await waitFor(() => {
            expect(screen.getByText("Confirm it's you")).toBeInTheDocument()
        })
    })

    test('opens OTP modal for registered email on form submit', async () => {
        // Mock successful passwordless login authorization
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({
            success: true
        })

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        await user.type(emailInput, '{enter}')

        await waitFor(() => {
            expect(screen.getByText("Confirm it's you")).toBeInTheDocument()
        })
    })

    test('renders continue button for guest checkout', async () => {
        // Mock the passwordless login to fail (email not found)
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockRejectedValue(
            new Error('Email not found')
        )

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        await waitFor(() => {
            expect(screen.getByText('Continue to Shipping Address')).toBeInTheDocument()
        })
    })

    test('handles OTP authorization failure gracefully', async () => {
        // Mock the passwordless login to fail
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockRejectedValue(
            new Error('Authorization failed')
        )

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        // Should show continue button for guest checkout when OTP fails
        await waitFor(() => {
            expect(screen.getByText('Continue to Shipping Address')).toBeInTheDocument()
        })
    })

    test('renders contact info title', () => {
        renderWithProviders(<ContactInfo />)

        expect(screen.getByText('Contact Info')).toBeInTheDocument()
    })

    test('does not render password-related fields', () => {
        renderWithProviders(<ContactInfo />)

        expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
        expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument()
        expect(screen.queryByText('Log In')).not.toBeInTheDocument()
    })

    test('does not render passwordless login options', () => {
        renderWithProviders(<ContactInfo />)

        expect(screen.queryByText('Secure Link')).not.toBeInTheDocument()
        expect(screen.queryByText('Password')).not.toBeInTheDocument()
        expect(screen.queryByText('Already have an account? Log in')).not.toBeInTheDocument()
        expect(screen.queryByText('Back to Sign In Options')).not.toBeInTheDocument()
    })

    test('renders OTP modal content correctly', async () => {
        // Mock successful OTP authorization
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({
            success: true
        })

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        // Wait for OTP modal to appear
        await waitFor(() => {
            expect(screen.getByText("Confirm it's you")).toBeInTheDocument()
        })

        // Verify modal content
        expect(
            screen.getByText('To use your account information enter the code sent to your email.')
        ).toBeInTheDocument()
        expect(screen.getByText('Checkout as a guest')).toBeInTheDocument()
        expect(screen.getByText('Resend code')).toBeInTheDocument()
    })
})
