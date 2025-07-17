/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import Footer from '@salesforce/retail-react-app/app/components/footer/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useBreakpointValue} from '@chakra-ui/react'

// Mock the Chakra UI hook
jest.mock('@chakra-ui/react', () => ({
    ...jest.requireActual('@chakra-ui/react'),
    useBreakpointValue: jest.fn()
}))

describe('Footer', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    test('renders component', () => {
        renderWithProviders(<Footer />)
        expect(screen.getByRole('link', {name: 'Privacy Policy'})).toBeInTheDocument()
    })

    test('renders mobile version by default', () => {
        renderWithProviders(<Footer />)
        // This link is hidden initially, but would be shown for desktop
        expect(screen.getByRole('link', {name: 'About Us', hidden: true})).toBeInTheDocument()
    })

    test('renders desktop version (desktop links visible)', () => {
        // Mock for desktop view - force all content to be visible
        useBreakpointValue.mockImplementation(() => true)

        renderWithProviders(<Footer />)

        // Get footer element and search within it
        const footer = screen.getByRole('contentinfo')
        const orderStatusLink = within(footer).getByText('Order Status')

        expect(orderStatusLink).toBeInTheDocument()
        expect(orderStatusLink).toHaveAttribute('href', '/uk/en-GB/order-status')
        expect(screen.getAllByText(/privacy policy/i)[0]).toBeInTheDocument()
    })

    test('renders mobile version (only mobile links visible)', () => {
        // Mock for mobile view - hide desktop content
        useBreakpointValue.mockImplementation(() => false)

        renderWithProviders(<Footer />)

        // Verify desktop elements are hidden
        expect(screen.queryByRole('link', {name: /order status/i})).not.toBeInTheDocument()
        expect(screen.getAllByText(/privacy policy/i)[0]).toBeInTheDocument()
    })
})
