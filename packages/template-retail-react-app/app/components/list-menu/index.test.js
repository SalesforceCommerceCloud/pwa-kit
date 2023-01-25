/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import ListMenu from './index'
import {renderWithProviders} from '../../utils/test-utils'

jest.setTimeout(60000)

describe('ListMenu', () => {
    test('ListMenu renders without errors', async () => {
        renderWithProviders(<ListMenu />)

        const drawer = document.getElementById('chakra-toast-portal')

        const category = await waitFor(() => screen.getByText(/Mens/i), {timeout: 10000})
        expect(category).toBeInTheDocument()
        expect(drawer).toBeInTheDocument()
        expect(screen.getByRole('navigation', {name: 'main'})).toBeInTheDocument()
    })
    test('ListMenu renders Spinner without root categories', () => {
        renderWithProviders(<ListMenu />, {
            wrapperProps: {initialCategories: {}}
        })

        const spinner = document.querySelector('.chakra-spinner')

        expect(spinner).toBeInTheDocument()
    })
})
