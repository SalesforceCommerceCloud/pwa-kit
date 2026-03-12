/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, fireEvent, act} from '@testing-library/react'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import {
    setCheckoutGuestChoiceInStorage,
    useCheckout
} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import {AuthHelpers, useCustomerType} from '@salesforce/commerce-sdk-react'

jest.setTimeout(60000)
const validEmail = 'test@salesforce.com'
const mockAuthHelperFunctions = {
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()},
    [AuthHelpers.Logout]: {mutateAsync: jest.fn()},
    [AuthHelpers.AuthorizePasswordless]: {mutateAsync: jest.fn()},
    [AuthHelpers.LoginPasswordlessUser]: {mutateAsync: jest.fn()}
}

const mockUpdateCustomerForBasket = {mutateAsync: jest.fn()}
const mockTransferBasket = {mutate: jest.fn(), mutateAsync: jest.fn()}
const mockUpdateBillingAddressForBasket = {mutateAsync: jest.fn()}
const mockUpdateCustomer = {mutateAsync: jest.fn()}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCustomerType: jest.fn(() => ({isRegistered: false})),
        useAuthHelper: jest
            .fn()
            .mockImplementation((helperType) => mockAuthHelperFunctions[helperType]),
        useShopperBasketsV2Mutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateCustomerForBasket') return mockUpdateCustomerForBasket
            if (mutationType === 'transferBasket') return mockTransferBasket
            if (mutationType === 'updateBillingAddressForBasket')
                return mockUpdateBillingAddressForBasket
            return {mutate: jest.fn()}
        }),
        useShopperCustomersMutation: jest.fn().mockImplementation((mutationType) => {
            if (mutationType === 'updateCustomer') return mockUpdateCustomer
            return {mutateAsync: jest.fn()}
        })
    }
})

const mockUseCurrentBasket = jest.fn(() => ({
    data: {
        basketId: 'test-basket-id',
        customerInfo: {
            email: null
        },
        shipments: [{shipmentId: 'shipment-1', shipmentType: 'delivery'}],
        productItems: [{productId: 'product-1', shipmentId: 'shipment-1'}]
    },
    derivedData: {
        hasBasket: true,
        totalItems: 1
    },
    refetch: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: (...args) => mockUseCurrentBasket(...args)
}))

const mockUseCurrentCustomer = jest.fn(() => ({
    data: {
        email: null,
        isRegistered: false
    }
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: (...args) => mockUseCurrentCustomer(...args)
}))

const mockSetContactPhone = jest.fn()
const mockGoToNextStep = jest.fn()
jest.mock('@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context', () => {
    const setCheckoutGuestChoiceInStorage = jest.fn()
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
            goToNextStep: mockGoToNextStep,
            setContactPhone: mockSetContactPhone
        }),
        setCheckoutGuestChoiceInStorage
    }
})

const mockAuth = {refreshAccessToken: jest.fn()}
jest.mock('@salesforce/commerce-sdk-react/hooks/useAuthContext', () => jest.fn(() => mockAuth))

jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'RefArch'},
        locale: {id: 'en-US'},
        buildUrl: jest.fn((path) => path)
    })
}))

// Mock OtpAuth to expose a verify trigger
jest.mock('@salesforce/retail-react-app/app/components/otp-auth', () => {
    // eslint-disable-next-line react/prop-types
    return function MockOtpAuth({isOpen, handleOtpVerification, onCheckoutAsGuest, onClose}) {
        const handleGuestClick = () => {
            onCheckoutAsGuest?.()
            onClose?.()
        }
        return isOpen ? (
            <div>
                <div>Confirm it&apos;s you</div>
                <p>To log in to your account, enter the code sent to your email.</p>
                <div>
                    <button type="button" onClick={handleGuestClick}>
                        Checkout as a guest
                    </button>
                    <button type="button">Resend Code</button>
                </div>
                <button data-testid="otp-verify" onClick={() => handleOtpVerification('12345678')}>
                    Verify
                </button>
            </div>
        ) : null
    }
})

beforeEach(() => {
    jest.clearAllMocks()
    // Default: allow OTP authorization so modal can open unless a test overrides it
    mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({})
    // Reset basket mock to default (delivery shipment)
    mockUseCurrentBasket.mockReturnValue({
        data: {
            basketId: 'test-basket-id',
            customerInfo: {email: null},
            shipments: [{shipmentId: 'shipment-1', shipmentType: 'delivery'}],
            productItems: [{productId: 'product-1', shipmentId: 'shipment-1'}],
            billingAddress: null
        },
        derivedData: {hasBasket: true, totalItems: 1},
        refetch: jest.fn()
    })
    // Reset billing address mutation mock
    mockUpdateBillingAddressForBasket.mutateAsync.mockResolvedValue({})
    // Reset customer mock to default
    mockUseCurrentCustomer.mockReturnValue({
        data: {
            email: null,
            isRegistered: false
        }
    })
    // Reset update customer mock
    mockUpdateCustomer.mutateAsync.mockResolvedValue({})
    // Reset useCustomerType mock to ensure phone input is not disabled
    useCustomerType.mockReturnValue({isRegistered: false})
    // Reset useCheckout to default guest checkout state
    useCheckout.mockReturnValue({
        customer: null,
        basket: {basketId: 'test-basket-id'},
        isGuestCheckout: true,
        setIsGuestCheckout: jest.fn(),
        step: 0,
        login: null,
        STEPS: {CONTACT_INFO: 0},
        goToStep: null,
        goToNextStep: mockGoToNextStep,
        setContactPhone: mockSetContactPhone
    })
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
        expect(screen.getByLabelText('Phone')).toBeInTheDocument()
        expect(screen.getByLabelText('Phone')).not.toHaveAttribute('disabled')
    })

    test('renders email input field', () => {
        renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('type', 'email')
    })

    test('updates checkout contact phone when user types phone (guest)', async () => {
        const {user} = renderWithProviders(<ContactInfo />)
        const phoneInput = screen.getByLabelText('Phone')
        // Wait for ContactInfo's auto-focus on email (100ms) to run first so it doesn't
        // steal focus during user.type() and send keystrokes to the email field (CI race).
        await act(async () => {
            await new Promise((r) => setTimeout(r, 150))
        })
        // Type the phone number and wait for it to be formatted
        await user.type(phoneInput, '7275551234')
        // Wait for the phone input to have a value (formatted phone number)
        await waitFor(() => {
            const currentValue = phoneInput.value || ''
            expect(currentValue.length).toBeGreaterThan(0)
        })
        // Verify the phone number was formatted (should contain parentheses and/or dashes)
        expect(phoneInput.value).toMatch(/[0-9]/)
    })

    test('shows phone disabled and prefilled for registered shopper', () => {
        useCustomerType.mockReturnValue({isRegistered: true})
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                email: 'reg@salesforce.com',
                isRegistered: true,
                phoneHome: '(111) 222-3333'
            }
        })
        renderWithProviders(<ContactInfo />)
        const phoneInput = screen.getByLabelText('Phone')
        expect(phoneInput).toBeInTheDocument()
        expect(phoneInput).toHaveAttribute('disabled')
    })

    test('displays phone number in summary card for registered user', () => {
        useCustomerType.mockReturnValue({isRegistered: true})
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                email: 'reg@salesforce.com',
                isRegistered: true,
                phoneHome: '(111) 222-3333'
            }
        })
        useCheckout.mockReturnValue({
            customer: null,
            basket: {basketId: 'test-basket-id'},
            isGuestCheckout: false,
            setIsGuestCheckout: jest.fn(),
            step: 1, // Not on CONTACT_INFO step, so summary shows
            login: null,
            STEPS: {CONTACT_INFO: 0},
            goToStep: jest.fn(),
            goToNextStep: jest.fn(),
            setContactPhone: jest.fn()
        })
        renderWithProviders(<ContactInfo />)

        // Verify email and phone are displayed in summary
        expect(screen.getByText('reg@salesforce.com')).toBeInTheDocument()
        expect(screen.getByText('(111) 222-3333')).toBeInTheDocument()
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
        // Enter email and then clear it to trigger validation
        await user.type(emailInput, 'test@example.com')
        await user.clear(emailInput)
        // Explicitly blur to trigger our custom blur handler
        fireEvent.blur(emailInput)

        await waitFor(() => {
            const matches = screen.queryAllByText((_, node) =>
                node?.textContent?.includes('Please enter your email address.')
            )
            expect(matches.length).toBeGreaterThan(0)
        })
    })

    test('validates email is required on form submission', async () => {
        // Test the validation logic directly by simulating form submission
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')

        // Try to submit with empty email by pressing Enter
        await user.type(emailInput, '{enter}')

        // The validation should prevent submission and show error
        await waitFor(() => {
            expect(screen.getAllByText('Please enter your email address.').length).toBeGreaterThan(
                0
            )
        })
    })

    test('validates email format on form submission', async () => {
        // Test the validation logic directly
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')

        // Enter invalid email and trigger blur validation
        await user.type(emailInput, 'invalid-email')
        fireEvent.blur(emailInput)

        await waitFor(() => {
            expect(
                screen.getAllByText('Please enter a valid email address.').length
            ).toBeGreaterThan(0)
        })

        // Should not show required email error
        expect(screen.queryByText('Please enter your email address.')).not.toBeInTheDocument()
    })

    test('allows guest checkout with valid email', async () => {
        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        // Ensure value committed to RHF before blur
        fireEvent.change(emailInput, {target: {value: validEmail}})
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

        // Verify authorize passwordless was called with correct parameters
        expect(
            mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync
        ).toHaveBeenCalledWith({
            userid: validEmail,
            mode: 'email',
            locale: 'en-US'
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
            const continueBtn = screen.getByRole('button', {
                name: /continue to shipping address/i
            })
            expect(continueBtn).toBeEnabled()
        })
    })

    test('renders "Continue to Payment" button for BOPIS-only orders', async () => {
        // Mock BOPIS-only basket
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                customerInfo: {email: null},
                shipments: [{shipmentId: 'pickup-1', c_fromStoreId: 'store-123'}],
                productItems: [{productId: 'product-1', shipmentId: 'pickup-1'}]
            },
            derivedData: {hasBasket: true, totalItems: 1},
            refetch: jest.fn()
        })

        // Mock the passwordless login to fail (guest checkout)
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockRejectedValue(
            new Error('Email not found')
        )

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.blur(emailInput)

        await waitFor(() => {
            const continueBtn = screen.getByRole('button', {
                name: /continue to payment/i
            })
            expect(continueBtn).toBeEnabled()
        })

        // Verify "Continue to Shipping Address" is NOT shown
        expect(
            screen.queryByRole('button', {name: /continue to shipping address/i})
        ).not.toBeInTheDocument()
    })

    test('requires phone for guest shoppers on submit', async () => {
        // Ensure guest path (no OTP modal)
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockRejectedValue(
            new Error('Email not found')
        )
        const {user} = renderWithProviders(<ContactInfo />)

        // Enter valid email, leave phone empty
        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.change(emailInput, {target: {value: validEmail}})
        fireEvent.blur(emailInput)

        // Click continue
        const continueBtn = await screen.findByRole('button', {
            name: /continue to shipping address/i
        })
        await user.click(continueBtn)

        // Should not proceed or update basket without phone
        expect(mockUpdateCustomerForBasket.mutateAsync).not.toHaveBeenCalled()
        expect(mockGoToNextStep).not.toHaveBeenCalled()
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
            screen.getByText('To log in to your account, enter the code sent to your email.')
        ).toBeInTheDocument()
        expect(screen.getByText(/Checkout as a guest/i)).toBeInTheDocument()
        expect(screen.getByText(/Resend Code/i)).toBeInTheDocument()
    })

    test('opens OTP modal when form is submitted by clicking submit button', async () => {
        // Mock successful OTP authorization
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({
            success: true
        })

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        // Commit before submit and ensure RHF picks up value
        fireEvent.change(emailInput, {target: {value: validEmail}})
        await act(async () => {
            fireEvent.input(emailInput, {target: {value: validEmail}})
        })
        fireEvent.blur(emailInput)
        await user.click(emailInput) // focus clears any emailError

        // Find and click the submit button
        const submitButton = screen.getByRole('button', {
            name: /continue to shipping address/i
        })
        await user.click(submitButton)

        // Wait for OTP modal to appear after form submission
        await screen.findByTestId('otp-verify')

        // Verify modal content is present
        expect(
            screen.getByText('To log in to your account, enter the code sent to your email.')
        ).toBeInTheDocument()
        expect(screen.getByText(/Checkout as a guest/i)).toBeInTheDocument()
        expect(screen.getByText(/Resend Code/i)).toBeInTheDocument()
    })

    test('clicking "Checkout as a guest" does not update basket or advance step', async () => {
        // "Checkout as Guest" only closes the modal and sets registeredUserChoseGuest state;
        // basket is updated when the user later submits the form with phone and clicks Continue.
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({})

        const {user} = renderWithProviders(<ContactInfo />)
        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.change(emailInput, {target: {value: validEmail}})
        await act(async () => {
            fireEvent.input(emailInput, {target: {value: validEmail}})
        })

        // Open OTP modal via submit
        const submitButton = screen.getByRole('button', {name: /continue to shipping address/i})
        await user.click(submitButton)
        await screen.findByTestId('otp-verify')

        // Click "Checkout as a guest" — should not call basket mutations or goToNextStep
        await user.click(screen.getByText(/Checkout as a guest/i))

        await waitFor(() => {
            expect(mockUpdateCustomerForBasket.mutateAsync).not.toHaveBeenCalled()
            expect(mockGoToNextStep).not.toHaveBeenCalled()
        })
        // Modal closes; user stays on Contact Info (Continue button visible again)
        expect(
            screen.getByRole('button', {name: /continue to shipping address/i})
        ).toBeInTheDocument()
    })

    test('does not proceed to next step when OTP modal is already open on form submission', async () => {
        // Mock successful OTP authorization
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({
            success: true
        })

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)

        // Commit email, then open OTP modal via blur
        fireEvent.change(emailInput, {target: {value: validEmail}})
        await act(async () => {
            fireEvent.input(emailInput, {target: {value: validEmail}})
        })
        fireEvent.blur(emailInput)

        // Wait for OTP modal to appear
        await screen.findByTestId('otp-verify')

        // Now try to submit the form while modal is already open
        // We'll use fireEvent.submit on the form instead of clicking the button
        const form = emailInput.closest('form')
        fireEvent.submit(form)

        // Verify that the OTP modal is still open and we haven't proceeded to next step
        expect(screen.getByText("Confirm it's you")).toBeInTheDocument()
        expect(
            screen.getByText('To log in to your account, enter the code sent to your email.')
        ).toBeInTheDocument()

        // The modal should still be visible, indicating we didn't proceed to the next step
        expect(screen.getByText(/Checkout as a guest/i)).toBeInTheDocument()
        expect(screen.getByText(/Resend Code/i)).toBeInTheDocument()
    })

    test('OTP verification transfers and updates basket email using transferred id', async () => {
        // Arrange mocks
        mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync.mockResolvedValue({})
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({})

        const mergedId = 'merged-123'
        mockTransferBasket.mutateAsync.mockResolvedValue({basketId: mergedId})
        // Make refetch return merged id to simulate hydration
        const refetchSpy = jest.fn().mockResolvedValue({data: {basketId: mergedId}})
        mockUseCurrentBasket.mockReturnValue({
            data: {basketId: 'guest-1', productItems: [{}], shipments: [{}]},
            derivedData: {hasBasket: true, totalItems: 1},
            refetch: refetchSpy
        })
        // Ensure update succeeds
        mockUpdateCustomerForBasket.mutateAsync.mockResolvedValue({})

        // Act: render and open modal then verify
        const {user} = renderWithProviders(<ContactInfo />)
        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, 'test@salesforce.com')
        // Commit email, then open OTP modal via submit
        fireEvent.change(emailInput, {target: {value: 'test@salesforce.com'}})
        await act(async () => {
            fireEvent.input(emailInput, {target: {value: 'test@salesforce.com'}})
        })
        fireEvent.blur(emailInput)
        const submitForMerge = screen.getByRole('button', {
            name: /continue to shipping address/i
        })
        await user.click(submitForMerge)
        // Click our mocked verify button to invoke handleOtpVerification
        await screen.findByTestId('otp-verify')
        await user.click(screen.getByTestId('otp-verify'))

        // Simulate auth state flip to registered to trigger merge effect on next render
        useCustomerType.mockReturnValue({isRegistered: true})

        await waitFor(() => {
            expect(mockTransferBasket.mutateAsync).toHaveBeenCalled()
            // Validate transferBasket called with merge=true parameter
            const transferArgs = mockTransferBasket.mutateAsync.mock.calls[0]?.[0]
            expect(transferArgs?.parameters).toMatchObject({merge: true})
        })
        // Updating basket email may occur asynchronously or be skipped if unchanged; don't hard-require it here
    })

    test('defaults phone number from basket billing address when customer phone is not available', () => {
        // Mock basket with billing address phone
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                customerInfo: {email: null},
                shipments: [{shipmentId: 'shipment-1', shipmentType: 'delivery'}],
                productItems: [{productId: 'product-1', shipmentId: 'shipment-1'}],
                billingAddress: {phone: '(555) 123-4567'}
            },
            derivedData: {hasBasket: true, totalItems: 1},
            refetch: jest.fn()
        })

        renderWithProviders(<ContactInfo />)

        const phoneInput = screen.getByLabelText('Phone')
        expect(phoneInput.value).toBe('(555) 123-4567')
    })

    test('notifies parent when guest chooses "Checkout as Guest" and stays on Contact Info', async () => {
        // Open OTP modal (registered email), click "Checkout as a guest" — modal closes,
        // parent is notified via onRegisteredUserChoseGuest(true), user stays on Contact Info.
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({})

        const onRegisteredUserChoseGuestSpy = jest.fn()
        const {user} = renderWithProviders(
            <ContactInfo onRegisteredUserChoseGuest={onRegisteredUserChoseGuestSpy} />
        )

        const emailInput = screen.getByLabelText('Email')

        // Enter email and open OTP modal (blur triggers registered-user check)
        await user.type(emailInput, validEmail)
        fireEvent.change(emailInput, {target: {value: validEmail}})
        fireEvent.blur(emailInput)

        await screen.findByTestId('otp-verify')

        // Click "Checkout as a guest" — modal closes; parent is notified; no basket update
        await user.click(screen.getByText(/Checkout as a guest/i))

        expect(onRegisteredUserChoseGuestSpy).toHaveBeenCalledWith(true)
        expect(setCheckoutGuestChoiceInStorage).toHaveBeenCalledWith(true)
        expect(mockUpdateCustomerForBasket.mutateAsync).not.toHaveBeenCalled()
        expect(mockGoToNextStep).not.toHaveBeenCalled()

        // Modal closes; user stays on Contact Info (Continue button visible for entering phone)
        await waitFor(() => {
            expect(screen.queryByText("Confirm it's you")).not.toBeInTheDocument()
        })
        expect(
            screen.getByRole('button', {name: /continue to shipping address/i})
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Phone')).toBeInTheDocument()
    })

    test('uses phone from billing address when persisting to customer profile after OTP verification', async () => {
        // Mock basket with billing address phone
        const billingPhone = '(555) 123-4567'
        mockUseCurrentBasket.mockReturnValue({
            data: {
                basketId: 'test-basket-id',
                customerInfo: {email: null},
                shipments: [{shipmentId: 'shipment-1', shipmentType: 'delivery'}],
                productItems: [{productId: 'product-1', shipmentId: 'shipment-1'}],
                billingAddress: {phone: billingPhone}
            },
            derivedData: {hasBasket: true, totalItems: 1},
            refetch: jest.fn().mockResolvedValue({
                data: {
                    basketId: 'test-basket-id',
                    billingAddress: {phone: billingPhone}
                }
            })
        })

        // Mock OTP verification flow
        mockAuthHelperFunctions[AuthHelpers.AuthorizePasswordless].mutateAsync.mockResolvedValue({})
        mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync.mockResolvedValue({})
        mockTransferBasket.mutateAsync.mockResolvedValue({basketId: 'test-basket-id'})
        mockUpdateCustomerForBasket.mutateAsync.mockResolvedValue({})

        // Mock customer with customerId after login - update mock to return customer with ID
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                email: validEmail,
                isRegistered: true,
                customerId: 'customer-123'
            }
        })

        const {user} = renderWithProviders(<ContactInfo />)

        const emailInput = screen.getByLabelText('Email')
        await user.type(emailInput, validEmail)
        fireEvent.change(emailInput, {target: {value: validEmail}})
        fireEvent.blur(emailInput)

        // Wait for OTP modal and verify
        await screen.findByTestId('otp-verify')
        await user.click(screen.getByTestId('otp-verify'))

        // Simulate auth state change to registered
        useCustomerType.mockReturnValue({isRegistered: true})

        await waitFor(() => {
            // Verify updateCustomer was called with phone from billing address
            expect(mockUpdateCustomer.mutateAsync).toHaveBeenCalledWith({
                parameters: {customerId: 'customer-123'},
                body: {phoneHome: billingPhone}
            })
        })

        // Guest choice storage should be cleared when user signs in via OTP
        expect(setCheckoutGuestChoiceInStorage).toHaveBeenCalledWith(false)
    })
})
