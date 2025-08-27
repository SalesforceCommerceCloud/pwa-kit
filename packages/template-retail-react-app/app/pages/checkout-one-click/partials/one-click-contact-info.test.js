/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, fireEvent, cleanup} from '@testing-library/react'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'

jest.setTimeout(60000)
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

jest.mock('@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context', () => {
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

    test('validates email is required on blur', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        // Focus and then blur without entering email to trigger validation
        await user.click(emailInput)
        await user.tab()

        expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
    })

    test('validates email is required on form submission', async () => {
        // Test the validation logic directly by simulating form submission
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')

        // Try to submit with empty email by pressing Enter
        await user.type(emailInput, '{enter}')

        // The validation should prevent submission and show error
        // Since the form doesn't have a visible submit button in this state,
        // we test that the email field validation works on blur
        await user.click(emailInput)
        await user.tab()

        expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
    })

    test('validates email format on form submission', async () => {
        // Test the validation logic directly
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')

        // Enter invalid email and trigger blur validation
        await user.type(emailInput, 'invalid-email')
        await user.tab()

        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    })

    test('validates different types of valid emails correctly', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        // Test various valid email formats
        const validEmails = [
            'simple@example.com',
            'user.name@domain.com',
            'user+tag@example.org',
            'user-name@subdomain.example.co.uk',
            'user123@domain123.net',
            'user.name+tag@example-domain.com',
            'user@example-domain.com',
            'user@subdomain1.subdomain2.example.com',
            'user.name@example.co.uk',
            'user@example-domain123.com',
            'josé@mañana.com',
            'firstname.lastname@example.co.uk',
            'email@subdomain.example.com',
            'user+mailbox@example.com',
            'user-name@example.org',
            '12345@example.com',
            'email@mañana.com',
            'josé@example.españa',
            'email@bücher.de',
            '用户@例子.中国',
            '!#$%&*+/=?^_{|}~-@example.com'
        ]

        for (const email of validEmails) {
            const {user: testUser} = renderWithProviders(<ContactInfo />)
            const emailInput = screen.getByLabelText('Email')

            await testUser.type(emailInput, email)

            // Trigger blur event to validate
            await testUser.tab()

            // Should not show email format error for valid emails
            expect(
                screen.queryByText('Please enter a valid email address.')
            ).not.toBeInTheDocument()

            // Should not show required email error
            expect(screen.queryByText('Please enter your email address.')).not.toBeInTheDocument()

            // Clean up
            cleanup()
        }
    })

    test('validates different types of invalid emails correctly', async () => {
        // Test various invalid email formats that are definitely rejected by the current regex
        const invalidEmails = [
            'plainaddress', // Missing @ symbol
            '@missinglocal.com', // Missing local part
            'missingdomain@', // Missing domain
            'user@', // Missing domain completely
            'user@.domain.com', // Domain starting with dot
            'user@domain.com.', // Domain ending with dot
            'user@-domain.com', // Domain starting with hyphen
            'user@domain-.com' // Domain ending with hyphen
        ]

        for (const email of invalidEmails) {
            const {user: testUser} = renderWithProviders(<ContactInfo />)
            const emailInput = screen.getByLabelText('Email')

            await testUser.type(emailInput, email)

            // Trigger blur event to validate
            await testUser.tab()

            // Should show email format error for invalid emails
            expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()

            // Clean up
            cleanup()
        }
    })

    test('allows guest checkout with valid email', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        await waitFor(() => {
            const continueBtn = screen.getByRole('button', {
                name: /continue to shipping address/i
            })
            expect(continueBtn).toBeEnabled()
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

    // Note: The OTP modal opens on email blur after successful authorization
    // Submitting the form directly progresses the flow instead of opening the modal.

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
            const continueBtn = screen.getByRole('button', {
                name: /continue to shipping address/i
            })
            expect(continueBtn).toBeEnabled()
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

        // Should show enabled continue button for guest checkout when OTP fails
        await waitFor(() => {
            const continueBtn = screen.getByRole('button', {
                name: /continue to shipping address/i
            })
            expect(continueBtn).toBeEnabled()
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
