/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'

const validEmail = 'test@salesforce.com'
const invalidEmail = 'invalidEmail'
const mockAuthHelperFunctions = {
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()},
    [AuthHelpers.Logout]: {mutateAsync: jest.fn()}
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

    test('allows guest checkout with valid email', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        await user.type(emailInput, '{enter}')

        await waitFor(() => {
            expect(mockUpdateCustomerForBasket.mutateAsync).toHaveBeenCalledWith({
                parameters: {basketId: 'test-basket-id'},
                body: {email: validEmail}
            })
        })
    })

    test('submits form with valid email', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        await user.type(emailInput, '{enter}')

        await waitFor(() => {
            expect(mockUpdateCustomerForBasket.mutateAsync).toHaveBeenCalled()
        })
    })

    test('displays error on submission failure', async () => {
        mockUpdateCustomerForBasket.mutateAsync.mockRejectedValue(new Error('Network error'))

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        await user.type(emailInput, '{enter}')

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument()
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
})
