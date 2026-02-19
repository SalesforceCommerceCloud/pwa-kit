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
