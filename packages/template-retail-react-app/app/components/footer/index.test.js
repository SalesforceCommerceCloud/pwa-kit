/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import Footer from '@salesforce/retail-react-app/app/components/footer/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

beforeEach(() => {
    getConfig.mockReturnValue(mockConfig)
})

test('renders component', () => {
    renderWithProviders(<Footer />)
    const privacyLinks = screen.getAllByRole('link', {name: 'Privacy Policy'})
    expect(privacyLinks.length).toBeGreaterThanOrEqual(1)
})

test('renders mobile version by default', () => {
    renderWithProviders(<Footer />)
    // This link is hidden initially, but would be shown for desktop
    expect(screen.getByRole('link', {name: 'About Us', hidden: true})).toBeInTheDocument()
})

test('renders SubscribeForm within Footer', () => {
    renderWithProviders(<Footer />)
    // Verify SubscribeForm renders correctly inside Footer
    // Note: Footer renders SubscribeForm twice (mobile + desktop versions), so we use getAllBy
    expect(screen.getByRole('heading', {name: /subscribe to stay updated/i})).toBeInTheDocument()
    const emailInputs = screen.getAllByLabelText(/email address for newsletter/i)
    expect(emailInputs.length).toBeGreaterThanOrEqual(1)
    const signUpButtons = screen.getAllByRole('button', {name: /subscribe/i})
    expect(signUpButtons.length).toBeGreaterThanOrEqual(1)
})

describe('Guest Order Lookup footer link', () => {
    test('does not render "Order Lookup" link when flag is off', () => {
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                guestOrderLookup: {enabled: false}
            }
        })
        renderWithProviders(<Footer />)
        expect(screen.queryByRole('link', {name: 'Order Lookup', hidden: true})).toBeNull()
    })

    test('does not render "Order Lookup" link when flag is absent', () => {
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app
            }
        })
        renderWithProviders(<Footer />)
        expect(screen.queryByRole('link', {name: 'Order Lookup', hidden: true})).toBeNull()
    })

    test('renders "Order Lookup" link when flag is on', () => {
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                guestOrderLookup: {enabled: true}
            }
        })
        renderWithProviders(<Footer />)
        const links = screen.getAllByRole('link', {name: 'Order Lookup', hidden: true})
        expect(links.length).toBeGreaterThanOrEqual(1)
        // href includes locale prefix (e.g. /uk/en-GB/order-lookup) depending on multi-site config
        expect(links[0].getAttribute('href')).toMatch(/\/order-lookup$/)
    })
})
