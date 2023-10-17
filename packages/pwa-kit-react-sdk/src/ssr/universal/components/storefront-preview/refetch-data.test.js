/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQueryClient} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import React from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import RefetchData from './refetch-data'

const referrerURL = 'some-url'
jest.mock('react-router-dom', () => {
    const replace = jest.fn()
    return {
        useHistory: jest.fn(() => ({
            replace
        })),
        useLocation: jest.fn(() => ({
            search: `?referrer=${referrerURL}`
        }))
    }
})

jest.mock('@tanstack/react-query', () => {
    const invalidateQueries = jest.fn()
    return {
        useQueryClient: jest.fn(() => ({
            invalidateQueries
        }))
    }
})

test('renders a loading spinner initially', () => {
    render(<RefetchData />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
})

test('wait for react-query cache to be invalidated', async () => {
    render(<RefetchData />)

    await waitFor(
        () => {
            expect(useQueryClient().invalidateQueries).toHaveBeenCalled()
        },
        {timeout: 5000}
    )
})

test('a project not using react-query', async () => {
    // If customer project does not use react-query, calling useQueryClient would throw an error
    useQueryClient.mockImplementationOnce(() => {
        throw new Error()
    })
    render(<RefetchData />)

    await waitFor(
        () => {
            // Expect to still continue despite the project not using react-query,
            // specifically continue to navigate back to the referrer.
            expect(useHistory().replace).toHaveBeenCalledWith(referrerURL)
        },
        {timeout: 5000}
    )
})

test('wait for soft navigation to the referrer', async () => {
    render(<RefetchData />)

    await waitFor(
        () => {
            expect(useHistory().replace).toHaveBeenCalledWith(referrerURL)
        },
        {timeout: 5000}
    )
})

test('detects when `referrer` search param cannot be found in the page url', async () => {
    const _error = console.error
    console.error = jest.fn()

    useLocation.mockImplementationOnce(() => ({
        search: ''
    }))

    render(<RefetchData />)

    await waitFor(() => {
        expect(console.error).toHaveBeenCalled()
    })
    console.error = _error
})
