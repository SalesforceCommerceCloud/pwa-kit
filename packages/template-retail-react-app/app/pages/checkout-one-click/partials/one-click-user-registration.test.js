/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import UserRegistration from '@salesforce/retail-react-app/../../app/pages/checkout-one-click/partials/one-click-user-registration'

const renderWithProviders = (component) => {
    return render(
        <IntlProvider locale="en" messages={{}}>
            {component}
        </IntlProvider>
    )
}

describe('UserRegistration', () => {
    const mockSetEnableUserRegistration = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders the form when isGuestCheckout is false', () => {
        renderWithProviders(
            <UserRegistration
                enableUserRegistration={false}
                setEnableUserRegistration={mockSetEnableUserRegistration}
                isGuestCheckout={false}
            />
        )

        expect(screen.getByText('Save for Future Use')).toBeInTheDocument()
        expect(screen.getByText(/Create an account for a faster checkout/)).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    test('hides the form when isGuestCheckout is true', () => {
        renderWithProviders(
            <UserRegistration
                enableUserRegistration={false}
                setEnableUserRegistration={mockSetEnableUserRegistration}
                isGuestCheckout={true}
            />
        )

        expect(screen.queryByText('Save for Future Use')).not.toBeInTheDocument()
        expect(screen.queryByText(/When you place your order/)).not.toBeInTheDocument()
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    test('checkbox state reflects enableUserRegistration prop', () => {
        renderWithProviders(
            <UserRegistration
                enableUserRegistration={true}
                setEnableUserRegistration={mockSetEnableUserRegistration}
                isGuestCheckout={false}
            />
        )

        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeChecked()
    })

    test('checkbox is rendered with correct initial state', () => {
        renderWithProviders(
            <UserRegistration
                enableUserRegistration={false}
                setEnableUserRegistration={mockSetEnableUserRegistration}
                isGuestCheckout={false}
            />
        )

        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeInTheDocument()
        expect(checkbox).not.toBeChecked()
    })

    test('form is hidden regardless of enableUserRegistration when isGuestCheckout is true', () => {
        // Test with enableUserRegistration = true
        const {rerender} = renderWithProviders(
            <UserRegistration
                enableUserRegistration={true}
                setEnableUserRegistration={mockSetEnableUserRegistration}
                isGuestCheckout={true}
            />
        )

        expect(screen.queryByText('Save for Future Use')).not.toBeInTheDocument()

        // Test with enableUserRegistration = false
        rerender(
            <IntlProvider locale="en" messages={{}}>
                <UserRegistration
                    enableUserRegistration={false}
                    setEnableUserRegistration={mockSetEnableUserRegistration}
                    isGuestCheckout={true}
                />
            </IntlProvider>
        )

        expect(screen.queryByText('Save for Future Use')).not.toBeInTheDocument()
    })

    test('form shows when isGuestCheckout is false regardless of enableUserRegistration', () => {
        // Test with enableUserRegistration = true
        const {rerender} = renderWithProviders(
            <UserRegistration
                enableUserRegistration={true}
                setEnableUserRegistration={mockSetEnableUserRegistration}
                isGuestCheckout={false}
            />
        )

        expect(screen.getByText('Save for Future Use')).toBeInTheDocument()

        // Test with enableUserRegistration = false
        rerender(
            <IntlProvider locale="en" messages={{}}>
                <UserRegistration
                    enableUserRegistration={false}
                    setEnableUserRegistration={mockSetEnableUserRegistration}
                    isGuestCheckout={false}
                />
            </IntlProvider>
        )

        expect(screen.getByText('Save for Future Use')).toBeInTheDocument()
    })
})
