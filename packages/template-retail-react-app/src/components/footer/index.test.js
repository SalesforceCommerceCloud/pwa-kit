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
    expect(screen.getByRole('link', {name: 'Privacy Policy'})).toBeInTheDocument()
})

test('renders mobile version by default', () => {
    renderWithProviders(<Footer />)
    // This link is hidden initially, but would be shown for desktop
    expect(screen.getByRole('link', {name: 'About Us', hidden: true})).toBeInTheDocument()
})
