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
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

// Mock the Chakra UI hook
jest.mock('@chakra-ui/react', () => ({
    ...jest.requireActual('@chakra-ui/react'),
    useBreakpointValue: jest.fn()
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

describe('Footer', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        // Default: OMS enabled with full app config (including sites/locales)
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: true}
            }
        })
    })

    test('renders component', () => {
        renderWithProviders(<Footer />)
        expect(screen.getByRole('link', {name: 'Privacy Policy'})).toBeInTheDocument()
    })

    test('renders mobile version by default', () => {
        renderWithProviders(<Footer />)
        // This link is hidden for mobile view but will be shown for desktop
        expect(screen.getByRole('link', {name: 'About Us', hidden: true})).toBeInTheDocument()
    })

    test('renders desktop version (desktop links visible)', () => {
        // Mock for desktop view - force all content to be visible
        useBreakpointValue.mockImplementation(() => true)
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: true}
            }
        })

        renderWithProviders(<Footer />)

        // Get footer element and search within it
        const footer = screen.getByRole('contentinfo')
        const orderStatusLink = within(footer).getByText('Order Status')

        expect(orderStatusLink).toBeInTheDocument()
        expect(orderStatusLink).toHaveAttribute('href', '/uk/en-GB/order-status')
        expect(screen.getAllByText(/privacy policy/i)[0]).toBeInTheDocument()
    })

    test('hides Order Status link on desktop when OMS is disabled', () => {
        useBreakpointValue.mockImplementation(() => true)
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: false}
            }
        })

        renderWithProviders(<Footer />)

        const footer = screen.getByRole('contentinfo')
        expect(within(footer).queryByText('Order Status')).not.toBeInTheDocument()
    })

    test('renders mobile version (only mobile links visible)', () => {
        // Mock for mobile view - hide desktop content
        useBreakpointValue.mockImplementation(() => false)

        renderWithProviders(<Footer />)

        // Hidden in Mobile screens. Verify that the link is not present.
        expect(screen.queryByRole('link', {name: /order status/i})).not.toBeInTheDocument()
        expect(screen.getAllByText(/privacy policy/i)[0]).toBeInTheDocument()
    })
})
