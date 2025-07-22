/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, screen, waitFor} from '@testing-library/react'
import {ListMenu} from './list-menu'
import {renderWithProviders} from '../../utils/test-utils'
import {mockCategories} from '../../../mocks/mock-data'
import userEvent from '@testing-library/user-event'

describe('ListMenu', () => {
    test('ListMenu renders without errors', async () => {
        const user = userEvent.setup()
        renderWithProviders(<ListMenu root={mockCategories.root} itemsKey="categories" />)

        const categoryTrigger = screen.getByText('Mens')
        expect(categoryTrigger).toBeInTheDocument()
        expect(screen.getByRole('navigation', {name: 'Main navigation'})).toBeInTheDocument()

        // Click on the chevron icon to open the popover
        const chevronIcon = screen.getByLabelText('chevron-down')
        await act(async () => {
            await user.click(chevronIcon)
        })

        const suit = screen.getByText(/suits/i)
        expect(suit).toBeInTheDocument()
    })

    test('ListMenu renders Spinner without root categories', () => {
        renderWithProviders(<ListMenu />, {
            wrapperProps: {initialCategories: {}}
        })
        const spinner = document.querySelector('.chakra-spinner')
        expect(spinner).toBeInTheDocument()
    })

    test('ListMenu keyboard accessibility - Enter opens popover, Escape closes it', async () => {
        const user = userEvent.setup()
        renderWithProviders(<ListMenu root={mockCategories.root} itemsKey="categories" />)

        // Find the popover trigger button (which wraps the entire ListMenuTrigger)
        const triggerButton = screen.getByRole('button', {expanded: false})
        expect(triggerButton).toBeInTheDocument()

        // Focus on the trigger button and press Enter to open popover
        await act(async () => {
            triggerButton.focus()
            await user.keyboard('{Enter}')
        })

        // Verify popover is open by checking aria-expanded attribute
        expect(triggerButton).toHaveAttribute('aria-expanded', 'true')

        // Verify popover content is visible
        const suit = screen.getByText(/suits/i)
        expect(suit).toBeInTheDocument()

        // Focus on a focusable element within the popover (the Suits link) before pressing Escape
        // In real non-test scenario, this focusing should already happen automatically.
        const suitsLink = screen.getByRole('link', {name: /suits/i})
        await act(async () => {
            suitsLink.focus()
            await user.keyboard('{Escape}')
        })

        // Verify popover is closed by checking aria-expanded attribute
        await waitFor(() => {
            expect(triggerButton).toHaveAttribute('aria-expanded', 'false')
        })
    })
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})
afterEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
})
