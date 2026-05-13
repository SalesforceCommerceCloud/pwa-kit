/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import UcpContinue from '@salesforce/retail-react-app/app/pages/continue/index'

const mockMutateAsync = jest.fn()
const mockGetTokenWhenReady = jest.fn()

jest.mock('@salesforce/retail-react-app/app/hooks', () => {
    const original = jest.requireActual('@salesforce/retail-react-app/app/hooks')
    return {
        ...original,
        useSearchParams: jest.fn(() => [{}])
    }
})

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useAuthHelper: jest.fn(() => ({mutateAsync: mockMutateAsync})),
    AuthHelpers: {LoginGuestUser: 'loginGuestUser'},
    useAccessToken: jest.fn(() => ({getTokenWhenReady: mockGetTokenWhenReady})),
    useConfig: jest.fn(() => ({
        proxy: 'http://localhost/mobify/proxy/api',
        organizationId: 'f_ecom_test_001',
        siteId: 'TestSite'
    }))
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {useSearchParams} = require('@salesforce/retail-react-app/app/hooks')

const VALID_PARAMS = {basketId: 'test-basket-id', usid: 'test-usid'}
let mockFetch

beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockResolvedValue({access_token: 'mock-token'})
    mockGetTokenWhenReady.mockResolvedValue('mock-token')
    mockFetch = jest.fn().mockResolvedValue({ok: true, status: 200})
    global.fetch = mockFetch
    delete window.location
    window.location = {replace: jest.fn()}
})

test('getTemplateName returns a string', () => {
    expect(typeof UcpContinue.getTemplateName()).toBe('string')
})

test('renders loading state when valid params are provided', () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    renderWithProviders(<UcpContinue />)
    expect(screen.getByText('Preparing your checkout...')).toBeInTheDocument()
})

test('shows error when required params are missing', async () => {
    useSearchParams.mockReturnValue([{}])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByText(/Missing required parameters/)).toBeInTheDocument()
    })
})

test('shows error when only basketId is missing', async () => {
    useSearchParams.mockReturnValue([{usid: 'test-usid'}])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByText(/Missing required parameters/)).toBeInTheDocument()
    })
})

test('shows error when only usid is missing', async () => {
    useSearchParams.mockReturnValue([{basketId: 'test-basket-id'}])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByText(/Missing required parameters/)).toBeInTheDocument()
    })
})

test('calls loginGuestUser on happy path', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    })
})

test('calls promote endpoint with correct URL and params', async () => {
    useSearchParams.mockReturnValue([{...VALID_PARAMS, merge: 'true'}])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/baskets/test-basket-id/actions/promote'),
            expect.objectContaining({method: 'POST'})
        )
    })
    const fetchUrl = mockFetch.mock.calls[0][0]
    expect(fetchUrl).toContain('siteId=TestSite')
    expect(fetchUrl).toContain('merge=true')
})

test('forwards overrideExisting param to promote endpoint', async () => {
    useSearchParams.mockReturnValue([{...VALID_PARAMS, overrideExisting: 'true'}])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
    })
    const fetchUrl = mockFetch.mock.calls[0][0]
    expect(fetchUrl).toContain('overrideExisting=true')
})

test('redirects to /checkout on success', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(window.location.replace).toHaveBeenCalledWith('/checkout')
    })
})

test('shows error when SLAS login fails', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    mockMutateAsync.mockRejectedValueOnce(new Error('SLAS failure'))
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
})

test('shows error when promote returns 404', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    mockFetch.mockResolvedValueOnce({ok: false, status: 404})
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByText(/basket was not found/)).toBeInTheDocument()
    })
})

test('shows error when promote returns 409', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    mockFetch.mockResolvedValueOnce({ok: false, status: 409})
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByText(/basket already exists/)).toBeInTheDocument()
    })
})

test('shows generic error when promote returns unexpected status', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    mockFetch.mockResolvedValueOnce({ok: false, status: 500})
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })
})

test('shows error when promote fetch throws network error', async () => {
    useSearchParams.mockReturnValue([VALID_PARAMS])
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    renderWithProviders(<UcpContinue />)
    await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })
})
