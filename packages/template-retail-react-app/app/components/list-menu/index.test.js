/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import ListMenu from './index'
import {renderWithProviders, setupMockServer} from '../../utils/test-utils'

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const server = setupMockServer()

describe('ListMenu', () => {
    test('ListMenu renders without errors', async () => {
        renderWithProviders(<ListMenu />)

        const drawer = document.getElementById('chakra-toast-portal')

        const category = await waitFor(() => screen.getByText(/Clothing/i))
        expect(category).toBeInTheDocument()
        expect(drawer).toBeInTheDocument()
        expect(screen.getByRole('navigation', {name: 'main'})).toBeInTheDocument()
    })
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
    jest.clearAllMocks()
})
afterAll(() => server.close())
