/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import ListMenu from '@salesforce/retail-react-app/app/components/list-menu/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {mockCategories} from '@salesforce/retail-react-app/app/mocks/mock-data'
import userEvent from '@testing-library/user-event'

describe('ListMenu', () => {
    test('ListMenu renders without errors', async () => {
        const user = userEvent.setup()
        renderWithProviders(<ListMenu root={mockCategories.root} />)

        const categoryTrigger = screen.getByText(/Mens/i)
        await user.hover(categoryTrigger)
        expect(categoryTrigger).toBeInTheDocument()
        expect(screen.getByRole('navigation', {name: 'main'})).toBeInTheDocument()
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
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})
afterEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
})
