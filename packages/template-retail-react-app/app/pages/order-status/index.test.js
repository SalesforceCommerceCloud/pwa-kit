/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import OrderStatusPage from '@salesforce/retail-react-app/app/pages/order-status/index.jsx'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Mock the navigation hook
const mockNavigate = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: () => mockNavigate
}))

// Mock the useCurrentCustomer hook
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    __esModule: true,
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))

describe('OrderStatusPage', () => {
    const user = userEvent.setup()

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterAll(() => {
        console.error.mockRestore()
    })

    beforeEach(() => {
        jest.clearAllMocks()
        // Default mock for guest user
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: false,
                customerType: 'guest'
            }
        })
    })

    test('displays order status page with main heading and proper page structure', () => {
        renderWithProviders(<OrderStatusPage />)

        // Check main page container
        expect(screen.getByTestId('order-status-page')).toBeInTheDocument()

        // Check heading
        expect(screen.getByRole('heading', {name: /order status/i})).toBeInTheDocument()
    })

    test('displays sign in card with brand logo and sign in button for guest users', () => {
        renderWithProviders(<OrderStatusPage />)

        // Check sign in card content
        expect(screen.getByText(/sign in with your account/i)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /sign in/i})).toBeInTheDocument()

        // Check brand logo using aria-label
        const brandLogo = screen.getByRole('img', {name: /brand-logo/i})
        expect(brandLogo).toBeInTheDocument()
    })

    test('hides sign in card completely for registered users', () => {
        // Mock registered user
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: true,
                customerType: 'registered'
            }
        })

        renderWithProviders(<OrderStatusPage />)

        // Check that sign in card is NOT present
        expect(screen.queryByText(/sign in with your account/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /sign in/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('img', {name: /brand-logo/i})).not.toBeInTheDocument()
    })

    test('hides sign in card when customer data is still loading', () => {
        // Mock loading state (customerType is null)
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: false,
                customerType: null
            }
        })

        renderWithProviders(<OrderStatusPage />)

        // Check that sign in card is NOT present during loading
        expect(screen.queryByText(/sign in with your account/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /sign in/i})).not.toBeInTheDocument()
    })

    test('navigates to login page when sign in button is clicked by guest users', async () => {
        renderWithProviders(<OrderStatusPage />)

        const signInButton = screen.getByRole('button', {name: /sign in/i})
        await user.click(signInButton)

        expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    test('displays complete page layout with sign in card for guest users', () => {
        renderWithProviders(<OrderStatusPage />)

        // Check main page structure
        const pageBox = screen.getByTestId('order-status-page')
        expect(pageBox).toBeInTheDocument()

        // Check heading
        const heading = screen.getByRole('heading', {name: /order status/i})
        expect(heading).toBeInTheDocument()

        // Check sign in card
        expect(screen.getByText(/sign in with your account/i)).toBeInTheDocument()
    })

    test('displays page layout without sign in card for registered users', () => {
        // Mock registered user
        mockUseCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: true,
                customerType: 'registered'
            }
        })

        renderWithProviders(<OrderStatusPage />)

        // Check main page structure
        const pageBox = screen.getByTestId('order-status-page')
        expect(pageBox).toBeInTheDocument()

        // Check heading
        const heading = screen.getByRole('heading', {name: /order status/i})
        expect(heading).toBeInTheDocument()

        // Check that sign in card is NOT present
        expect(screen.queryByText(/sign in with your account/i)).not.toBeInTheDocument()
    })
})
