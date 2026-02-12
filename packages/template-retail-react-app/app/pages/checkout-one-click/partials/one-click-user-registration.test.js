/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {IntlProvider} from 'react-intl'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserRegistration from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-user-registration'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
    () => ({
        useCheckout: () => ({contactPhone: ''})
    })
)

const {AuthHelpers} = jest.requireActual('@salesforce/commerce-sdk-react')

const TEST_MESSAGES = {
    'checkout.title.user_registration': 'Save Checkout Info for Future Use',
    'checkout.label.user_registration': 'Create an account to check out faster',
    'checkout.message.user_registration':
        'Your payment, address, and contact information will be saved in a new account.'
}

const mockAuthHelperFunctions = {
    [AuthHelpers.AuthorizePasswordless]: {mutateAsync: jest.fn()},
    [AuthHelpers.LoginPasswordlessUser]: {mutateAsync: jest.fn()}
}

const mockCreateCustomerAddress = {mutateAsync: jest.fn().mockResolvedValue({})}
const mockUpdateCustomer = {mutateAsync: jest.fn().mockResolvedValue({})}
const mockCreateCustomerPaymentInstrument = {mutateAsync: jest.fn().mockResolvedValue({})}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const original = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...original,
        useCustomerType: jest.fn(),
        useAuthHelper: jest.fn((helper) => mockAuthHelperFunctions[helper]),
        useShopperCustomersMutation: jest.fn((mutationType) => {
            if (mutationType === 'createCustomerAddress') return mockCreateCustomerAddress
            if (mutationType === 'updateCustomer') return mockUpdateCustomer
            if (mutationType === 'createCustomerPaymentInstrument')
                return mockCreateCustomerPaymentInstrument
            return {mutateAsync: jest.fn()}
        })
    }
})
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext', () =>
    jest.fn(() => ({refreshAccessToken: jest.fn().mockResolvedValue(undefined)}))
)

jest.mock('@salesforce/retail-react-app/app/components/otp-auth', () => {
    // eslint-disable-next-line react/prop-types
    const MockOtpAuth = function ({isOpen, handleOtpVerification, onClose, isGuestRegistration}) {
        return isOpen ? (
            <>
                <div data-testid={isGuestRegistration ? 'otp-guest' : 'otp-returning'} />
                <button onClick={() => handleOtpVerification('otp-123')} data-testid="otp-verify">
                    Verify OTP
                </button>
                <button onClick={onClose} data-testid="otp-close">
                    Close
                </button>
            </>
        ) : null
    }
    return MockOtpAuth
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'RefArch'},
        locale: {id: 'en-US'},
        buildUrl: jest.fn((path) => path)
    })
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
        onRegistered: overrides.onRegistered ?? jest.fn(),
        onLoadingChange: overrides.onLoadingChange ?? jest.fn()
    }

    const utils = render(
        <IntlProvider locale="en-GB" messages={TEST_MESSAGES}>
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
                mode: 'email',
                locale: 'en-US',
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

    test('blocks duplicate OTP sends until reset', async () => {
        const user = userEvent.setup()
        const {authorizePasswordlessLogin} = setup()
        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        // Click to enable
        await user.click(checkbox)
        await waitFor(() => {
            expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
        })
        // Click to enable again without unchecking/closing — should not send again
        await user.click(checkbox)
        expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
    })

    test('re-sends OTP after modal close and retry', async () => {
        const user = userEvent.setup()
        // Arrange mocks without rendering via setup()
        const defaultBasket = {
            basketId: 'basket-123',
            customerInfo: {email: 'test@example.com'},
            productItems: [{productId: 'sku-1', quantity: 1}],
            shipments: [{shippingAddress: {address1: '123 Main'}, shippingMethod: {id: 'Ground'}}]
        }
        useCurrentBasket.mockReturnValue({data: defaultBasket})
        useCustomerType.mockReturnValue({isGuest: true})
        const authorizePasswordlessLogin =
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless]
        authorizePasswordlessLogin.mutateAsync.mockResolvedValue({})
        // Wrapper to control the enableUserRegistration prop to simulate real toggling
        const Stateful = () => {
            const [enabled, setEnabled] = React.useState(false)
            return (
                <IntlProvider locale="en-GB" messages={TEST_MESSAGES}>
                    <UserRegistration
                        enableUserRegistration={enabled}
                        setEnableUserRegistration={(val) => setEnabled(val)}
                        isGuestCheckout={false}
                        isDisabled={false}
                        onSavePreferenceChange={jest.fn()}
                        onRegistered={jest.fn()}
                    />
                </IntlProvider>
            )
        }
        render(<Stateful />)
        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        // First enable triggers OTP send and opens modal
        await user.click(checkbox) // enable -> true
        await waitFor(() => {
            expect(screen.getByTestId('otp-guest')).toBeInTheDocument()
        })
        expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
        // Close the modal (this should reset the guard)
        await user.click(screen.getByTestId('otp-close'))
        // Toggle off then on to re-enable
        await user.click(checkbox) // disable -> false
        await user.click(checkbox) // enable -> true
        // Should send OTP again after close + re-enable
        await waitFor(() => {
            expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(2)
        })
    })

    test('re-sends OTP after uncheck and re-check', async () => {
        const user = userEvent.setup()
        // Arrange mocks without rendering via setup()
        const defaultBasket = {
            basketId: 'basket-123',
            customerInfo: {email: 'test@example.com'},
            productItems: [{productId: 'sku-1', quantity: 1}],
            shipments: [{shippingAddress: {address1: '123 Main'}, shippingMethod: {id: 'Ground'}}]
        }
        useCurrentBasket.mockReturnValue({data: defaultBasket})
        useCustomerType.mockReturnValue({isGuest: true})
        const authorizePasswordlessLogin =
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless]
        authorizePasswordlessLogin.mutateAsync.mockResolvedValue({})
        // Wrapper to control the enableUserRegistration prop to simulate real toggling
        const Stateful = () => {
            const [enabled, setEnabled] = React.useState(false)
            return (
                <IntlProvider locale="en-GB" messages={TEST_MESSAGES}>
                    <UserRegistration
                        enableUserRegistration={enabled}
                        setEnableUserRegistration={(val) => setEnabled(val)}
                        isGuestCheckout={false}
                        isDisabled={false}
                        onSavePreferenceChange={jest.fn()}
                        onRegistered={jest.fn()}
                    />
                </IntlProvider>
            )
        }
        render(<Stateful />)
        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        // Enable -> first send
        await user.click(checkbox) // enable -> true
        await waitFor(() => {
            expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(1)
        })
        // Uncheck
        await user.click(checkbox) // disable -> false
        // Re-check -> should send again due to guard reset on uncheck
        await user.click(checkbox) // enable -> true
        await waitFor(() => {
            expect(authorizePasswordlessLogin.mutateAsync).toHaveBeenCalledTimes(2)
        })
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

    test('shows account creation notification after successful OTP verification', async () => {
        const user = userEvent.setup()
        setup()
        // Enable registration to trigger OTP
        await user.click(screen.getByRole('checkbox', {name: /Create an account/i}))
        // Verify OTP (mocked)
        const otpButton = await screen.findByTestId('otp-verify')
        await user.click(otpButton)
        // Notification should appear after registration succeeds
        await waitFor(() => {
            expect(screen.getByTestId('sf-account-creation-notification')).toBeInTheDocument()
        })
        // Optional: assert key content
        expect(screen.getByText(/Account Created/i)).toBeInTheDocument()
        // Use aria-label to avoid ambiguity with body text containing 'verified'
        expect(screen.getByLabelText(/Verified/i)).toBeInTheDocument()
    })

    test('renders account creation notification when showNotice prop is true', async () => {
        render(
            <IntlProvider locale="en-GB">
                <UserRegistration
                    enableUserRegistration={false}
                    setEnableUserRegistration={jest.fn()}
                    isGuestCheckout={false}
                    isDisabled={false}
                    onSavePreferenceChange={jest.fn()}
                    onRegistered={jest.fn()}
                    showNotice
                />
            </IntlProvider>
        )
        expect(screen.getByTestId('sf-account-creation-notification')).toBeInTheDocument()
        expect(screen.getByText(/Account Created/i)).toBeInTheDocument()
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

    test('shows loading overlay when guest user clicks registration checkbox', async () => {
        const user = userEvent.setup()
        const onLoadingChange = jest.fn()
        setup({
            onLoadingChange,
            authorizeMutate: jest.fn().mockImplementation(() => {
                // Simulate async delay
                return new Promise((resolve) => setTimeout(() => resolve({}), 100))
            })
        })

        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        await user.click(checkbox)

        // Verify loading overlay appears
        await waitFor(() => {
            expect(screen.getByTestId('sf-otp-loading-overlay')).toBeInTheDocument()
        })

        // Verify onLoadingChange was called with true
        expect(onLoadingChange).toHaveBeenCalledWith(true)

        // Wait for OTP modal to open (which clears loading state)
        await waitFor(
            () => {
                expect(screen.getByTestId('otp-guest')).toBeInTheDocument()
            },
            {timeout: 2000}
        )

        // Verify loading overlay disappears when OTP modal opens
        await waitFor(() => {
            expect(screen.queryByTestId('sf-otp-loading-overlay')).not.toBeInTheDocument()
        })

        // Verify onLoadingChange was called with false when modal opens
        expect(onLoadingChange).toHaveBeenCalledWith(false)
    })

    test('hides loading overlay when OTP authorization fails', async () => {
        const user = userEvent.setup()
        const onLoadingChange = jest.fn()
        // Make the error happen after a small delay to ensure overlay appears first
        const authorizeMutate = jest.fn().mockImplementation(() => {
            return new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Authorization failed')), 50)
            })
        })
        setup({
            onLoadingChange,
            authorizeMutate
        })

        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        await user.click(checkbox)

        // Verify loading overlay appears initially
        await waitFor(() => {
            expect(screen.getByTestId('sf-otp-loading-overlay')).toBeInTheDocument()
        })
        expect(onLoadingChange).toHaveBeenCalledWith(true)

        // Wait for error to be handled
        await waitFor(
            () => {
                expect(screen.queryByTestId('sf-otp-loading-overlay')).not.toBeInTheDocument()
            },
            {timeout: 2000}
        )

        // Verify onLoadingChange was called with false on error
        expect(onLoadingChange).toHaveBeenCalledWith(false)
        // OTP modal should not open on error
        expect(screen.queryByTestId('otp-guest')).not.toBeInTheDocument()
    })

    test('does not show loading overlay for registered users', async () => {
        const user = userEvent.setup()
        const onLoadingChange = jest.fn()
        setup({isGuest: false, onLoadingChange})

        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})
        await user.click(checkbox)

        // Loading overlay should not appear for registered users
        expect(screen.queryByTestId('sf-otp-loading-overlay')).not.toBeInTheDocument()
        expect(onLoadingChange).not.toHaveBeenCalled()
    })

    test('clears loading state when checkbox is unchecked', async () => {
        const user = userEvent.setup()
        const onLoadingChange = jest.fn()
        const authorizeMutate = jest.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve({}), 200))
        })

        // Wrapper to control the enableUserRegistration prop
        const TestWrapper = () => {
            const [enabled, setEnabled] = useState(false)
            return (
                <IntlProvider locale="en-GB" messages={TEST_MESSAGES}>
                    <UserRegistration
                        enableUserRegistration={enabled}
                        setEnableUserRegistration={setEnabled}
                        onLoadingChange={onLoadingChange}
                    />
                </IntlProvider>
            )
        }

        useCurrentBasket.mockReturnValue({
            data: {
                basketId: 'basket-123',
                customerInfo: {email: 'test@example.com'},
                productItems: [{productId: 'sku-1', quantity: 1}],
                shipments: [
                    {shippingAddress: {address1: '123 Main'}, shippingMethod: {id: 'Ground'}}
                ]
            }
        })
        useCustomerType.mockReturnValue({isGuest: true})
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync = authorizeMutate

        render(<TestWrapper />)

        const checkbox = screen.getByRole('checkbox', {name: /Create an account/i})

        // Check the checkbox
        await user.click(checkbox)

        // Wait for loading to start
        await waitFor(() => {
            expect(onLoadingChange).toHaveBeenCalledWith(true)
        })

        // Uncheck the checkbox before OTP modal opens
        await user.click(checkbox)

        // Verify loading state is cleared
        await waitFor(() => {
            expect(onLoadingChange).toHaveBeenCalledWith(false)
        })
        expect(screen.queryByTestId('sf-otp-loading-overlay')).not.toBeInTheDocument()
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
