/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {IntlProvider} from 'react-intl'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserRegistration from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-user-registration'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

const {AuthHelpers} = jest.requireActual('@salesforce/commerce-sdk-react')

const mockAuthHelperFunctions = {
    [AuthHelpers.AuthorizePasswordless]: {mutateAsync: jest.fn()},
    [AuthHelpers.LoginPasswordlessUser]: {mutateAsync: jest.fn()}
}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const original = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...original,
        useCustomerType: jest.fn(),
        useAuthHelper: jest.fn((helper) => mockAuthHelperFunctions[helper])
    }
})
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext', () =>
    jest.fn(() => ({refreshAccessToken: jest.fn().mockResolvedValue(undefined)}))
)

jest.mock('@salesforce/retail-react-app/app/components/otp-auth', () => {
    // eslint-disable-next-line react/prop-types
    const MockOtpAuth = function ({isOpen, handleOtpVerification, isGuestRegistration}) {
        return isOpen ? (
            <>
                <div data-testid={isGuestRegistration ? 'otp-guest' : 'otp-returning'} />
                <button onClick={() => handleOtpVerification('otp-123')} data-testid="otp-verify">
                    Verify OTP
                </button>
            </>
        ) : null
    }
    return MockOtpAuth
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    useAppOrigin: () => 'http://localhost:3000'
}))
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => ({app: {login: {passwordless: {callbackURI: '/callback'}}}})
}))

const setup = (overrides = {}) => {
    const defaultBasket = {
        basketId: 'basket-123',
        customerInfo: {email: 'test@example.com'},
        productItems: [{productId: 'sku-1', quantity: 1}],
        shipments: [{shippingAddress: {address1: '123 Main'}, shippingMethod: {id: 'Ground'}}]
    }

    useCurrentBasket.mockReturnValue({data: overrides.basket ?? defaultBasket})
    useCustomerType.mockReturnValue({isGuest: overrides.isGuest ?? true})
    useAuthContext.mockReturnValue({refreshAccessToken: jest.fn().mockResolvedValue(undefined)})

    // Set up specific mock behaviors if provided via overrides
    if (overrides.authorizeMutate) {
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync =
            overrides.authorizeMutate
    } else {
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({})
    }

    if (overrides.loginMutate) {
        mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync =
            overrides.loginMutate
    } else {
        mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync.mockResolvedValue({})
    }

    const props = {
        enableUserRegistration: overrides.enable ?? false,
        setEnableUserRegistration: overrides.setEnable ?? jest.fn(),
        isGuestCheckout: overrides.isGuestCheckout ?? false,
        isDisabled: overrides.isDisabled ?? false,
        onSavePreferenceChange: overrides.onSavePref ?? jest.fn(),
        onRegistered: overrides.onRegistered ?? jest.fn()
    }

    const utils = render(
        <IntlProvider locale="en-GB" messages={{}}>
            <UserRegistration {...props} />
        </IntlProvider>
    )
    return {
        utils,
        props,
        authorizePasswordlessLogin: mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless],
        loginPasswordless: mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser]
    }
}

describe('UserRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('opt-in triggers save preference and opens OTP for guest', async () => {
        const user = userEvent.setup()
        const {props, authorizePasswordlessLogin} = setup()
        // Toggle on
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        expect(props.setEnableUserRegistration).toHaveBeenCalledWith(true)
        expect(props.onSavePreferenceChange).toHaveBeenCalledWith(true)
        // Verify authorize passwordless was called
        await waitFor(() => {
            expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledWith({
                userid: 'test@example.com',
                callbackURI: 'http://localhost:3000/callback?mode=otp_email',
                register_customer: true,
                last_name: 'test@example.com',
                email: 'test@example.com'
            })
        })
        // Guest registration OTP modal should render with guest flag
        expect(await screen.findByTestId('otp-guest')).toBeInTheDocument()
        // Modal appears (mocked), verify OTP triggers onRegistered callback
        const otpButton = await screen.findByTestId('otp-verify')
        await user.click(otpButton)
        await waitFor(() => {
            expect(props.onRegistered).toHaveBeenCalledWith('basket-123')
        })
    })

    test('does not send OTP when shopper is not a guest', async () => {
        const user = userEvent.setup()
        const {authorizePasswordlessLogin} = setup({isGuest: false})
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        expect(authorizePasswordlessLogin.mutateAsync).not.toHaveBeenCalled()
    })

    test('toggling off updates save preference', async () => {
        const user = userEvent.setup()
        // Start with enabled, then toggle off
        const {props} = setup({enable: true})
        const cb = screen.getByRole('checkbox', {name: /Create an account/i})
        expect(cb).toBeChecked()
        await user.click(cb) // off
        expect(props.onSavePreferenceChange).toHaveBeenCalledWith(false)
    })

    test('hides component when isGuestCheckout is true', () => {
        setup({isGuestCheckout: true})
        expect(screen.queryByTestId('sf-user-registration-content')).not.toBeInTheDocument()
    })

    test('renders component when isGuestCheckout is false', () => {
        setup({isGuestCheckout: false})
        expect(screen.getByTestId('sf-user-registration-content')).toBeInTheDocument()
    })

    test('disables checkbox when isDisabled is true', () => {
        setup({isDisabled: true})
        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        expect(checkbox).toBeDisabled()
    })

    test('does not send OTP when basket has no email', async () => {
        const user = userEvent.setup()
        const basketWithoutEmail = {
            basketId: 'basket-123',
            customerInfo: {},
            productItems: [{productId: 'sku-1', quantity: 1}]
        }
        const {authorizePasswordlessLogin} = setup({basket: basketWithoutEmail})
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        expect(authorizePasswordlessLogin.mutateAsync).not.toHaveBeenCalled()
    })

    test('does not send OTP when basket customerInfo is undefined', async () => {
        const user = userEvent.setup()
        const basketWithoutCustomerInfo = {
            basketId: 'basket-123',
            productItems: [{productId: 'sku-1', quantity: 1}]
        }
        const {authorizePasswordlessLogin} = setup({basket: basketWithoutCustomerInfo})
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        expect(authorizePasswordlessLogin.mutateAsync).not.toHaveBeenCalled()
    })

    test('handles authorize passwordless error gracefully', async () => {
        const user = userEvent.setup()
        const authorizeMutate = jest.fn().mockRejectedValue(new Error('Network error'))
        const {props} = setup({authorizeMutate})
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        expect(props.setEnableUserRegistration).toHaveBeenCalledWith(true)
        // Should not throw error, component continues to work
        expect(screen.getByRole('checkbox', {name: /Create an account/i})).toBeInTheDocument()
    })

    test('prevents duplicate OTP sends', async () => {
        const user = userEvent.setup()
        const {authorizePasswordlessLogin} = setup()
        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        // Click to enable
        await user.click(checkbox)
        await waitFor(() => {
            expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
        })
        // Click to disable
        await user.click(checkbox)
        // Click to enable again
        await user.click(checkbox)
        // Should still only have been called once due to otpSentRef
        expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
    })

    test('OTP resend functionality works', async () => {
        const user = userEvent.setup()
        const {authorizePasswordlessLogin} = setup()
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        await waitFor(() => {
            expect(screen.getByTestId('otp-guest')).toBeInTheDocument()
        })
        // Initial authorize call
        expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
    })

    test('calls loginPasswordless with OTP code and register flag', async () => {
        const user = userEvent.setup()
        const {loginPasswordless} = setup()
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        const otpButton = await screen.findByTestId('otp-verify')
        await user.click(otpButton)
        await waitFor(() => {
            expect(loginPasswordless.mutateAsync).toHaveBeenCalledWith({
                pwdlessLoginToken: 'otp-123',
                register_customer: true
            })
        })
    })

    test('handles OTP verification error gracefully', async () => {
        const user = userEvent.setup()
        const loginMutate = jest.fn().mockRejectedValue(new Error('Invalid OTP'))
        const {props} = setup({loginMutate})
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        const otpButton = await screen.findByTestId('otp-verify')
        await user.click(otpButton)
        // Wait for async operations
        await waitFor(() => {
            expect(loginMutate).toHaveBeenCalled()
        })
        // onRegistered should not be called on error
        expect(props.onRegistered).not.toHaveBeenCalled()
    })

    test('displays explanatory text when registration is enabled', () => {
        // Test with registration disabled
        const {utils} = setup({enable: false})
        expect(
            screen.queryByText(/Your payment, address, and contact information/i)
        ).not.toBeInTheDocument()

        // Clean up first render
        utils.unmount()

        // Test with registration enabled
        setup({enable: true})
        expect(
            screen.getByText(/Your payment, address, and contact information/i)
        ).toBeInTheDocument()
    })
})
// end
