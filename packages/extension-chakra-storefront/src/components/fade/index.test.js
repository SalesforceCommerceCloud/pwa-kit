/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import '@testing-library/jest-dom'

import Fade from '../../components/fade'
import {renderWithProviders} from '../../utils/test-utils'

test('renders children and starts hidden (opacity 0)', () => {
    renderWithProviders(
        <Fade in={false} data-testid="fade-wrapper">
            <div>Fade me</div>
        </Fade>
    )

    const wrapper = screen.getByTestId('fade-wrapper')

    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveStyle('opacity: 0')
})

test('renders children and shows with opacity 1 after mount', async () => {
    renderWithProviders(
        <Fade in={true} data-testid="fade-wrapper">
            <div>Fade me in</div>
        </Fade>
    )

    const wrapper = await screen.findByTestId('fade-wrapper')

    expect(wrapper).toHaveStyle('opacity: 1')
})
