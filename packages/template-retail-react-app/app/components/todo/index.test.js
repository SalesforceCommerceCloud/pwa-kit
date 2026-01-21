/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import Todo from '.'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'

// Mock todos data
const mockTodosData = [
    {id: 1, title: 'Test Todo 1', completed: false},
    {id: 2, title: 'Test Todo 2', completed: true}
]

describe('Todo', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders todos when data is loaded', async () => {
        // Set up API mock to return todos data
        prependHandlersToServer([
            {
                path: 'https://jsonplaceholder.typicode.com/todos',
                res: () => mockTodosData
            }
        ])

        renderWithProviders(<Todo />)

        // Wait for the data to load
        await waitFor(() => {
            expect(screen.getByText('Todo List')).toBeInTheDocument()
        })

        // Check that the todos are rendered
        expect(screen.getByText('Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('Test Todo 2')).toBeInTheDocument()
    })

    test('renders loading state', async () => {
        // Set up API mock with delay to show loading state
        prependHandlersToServer([
            {
                path: 'https://jsonplaceholder.typicode.com/todos',
                delay: 1000, // Add delay to ensure loading state is shown
                res: () => mockTodosData
            }
        ])

        renderWithProviders(<Todo />)

        // Should show loading state before data arrives
        expect(screen.getByText('Loading todos...')).toBeInTheDocument()
    })

    test('renders error state when fetch fails', async () => {
        // Set up API mock to return error
        prependHandlersToServer([
            {
                path: 'https://jsonplaceholder.typicode.com/todos',
                status: 500, // Return error status
                res: () => ({message: 'Network error'})
            }
        ])

        renderWithProviders(<Todo />)

        // Wait for error state to be shown
        await waitFor(() => {
            expect(screen.getByText(/Error loading todos/)).toBeInTheDocument()
        })
    })
})