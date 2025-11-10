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
import {useCustomerType, useAuthHelper} from '@salesforce/commerce-sdk-react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')
jest.mock('@salesforce/commerce-sdk-react', () => {
    const original = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...original,
        useCustomerType: jest.fn(),
        useAuthHelper: jest.fn()
    }
})
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext', () =>
    jest.fn(() => ({refreshAccessToken: jest.fn().mockResolvedValue(undefined)}))
)

jest.mock('@salesforce/retail-react-app/app/components/otp-auth', () => {
    // eslint-disable-next-line react/prop-types
    const MockOtpAuth = function ({isOpen, handleOtpVerification}) {
        return isOpen ? (
            <button onClick={() => handleOtpVerification('otp-123')} data-testid="otp-verify">
                Verify OTP
            </button>
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
jest.mock('@salesforce/retail-react-app/app/hooks/use-basket-recovery', () => () => ({
    recoverBasketAfterAuth: jest.fn(async () => 'basket-new-123')
}))

const setup = (overrides = {}) => {
    const defaultBasket = {
        customerInfo: {email: 'test@example.com'},
        productItems: [{productId: 'sku-1', quantity: 1}],
        shipments: [{shippingAddress: {address1: '123 Main'}, shippingMethod: {id: 'Ground'}}]
    }
    useCurrentBasket.mockReturnValue({data: overrides.basket ?? defaultBasket})
    useCustomerType.mockReturnValue({isGuest: overrides.isGuest ?? true})
    useAuthContext.mockReturnValue({refreshAccessToken: jest.fn().mockResolvedValue(undefined)})

    const authorizePasswordlessLogin = {mutateAsync: jest.fn().mockResolvedValue({})}
    const loginPasswordless = {mutateAsync: jest.fn().mockResolvedValue({})}
    useAuthHelper.mockImplementation((helper) => {
        if (helper && helper.name && /AuthorizePasswordless/i.test(helper.name)) {
            return authorizePasswordlessLogin
        }
        if (helper && helper.name && /LoginPasswordlessUser/i.test(helper.name)) {
            return loginPasswordless
        }
        return {mutateAsync: jest.fn()}
    })

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
    return {utils, props, authorizePasswordlessLogin, loginPasswordless}
}

describe('UserRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('opt-in triggers save preference and opens OTP for guest', async () => {
        const user = userEvent.setup()
        const {props} = setup()
        // Toggle on
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        expect(props.setEnableUserRegistration).toHaveBeenCalledWith(true)
        expect(props.onSavePreferenceChange).toHaveBeenCalledWith(true)
        // Modal appears (mocked), verify OTP triggers onRegistered callback
        const otpButton = await screen.findByTestId('otp-verify')
        await user.click(otpButton)
        await waitFor(() => {
            expect(props.onRegistered).toHaveBeenCalledWith('basket-new-123')
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
})
// end
