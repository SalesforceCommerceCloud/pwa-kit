/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {waitFor} from '@testing-library/react'
import PropTypes from 'prop-types'
import useExternalSearch from '@salesforce/retail-react-app/app/hooks/use-external-search'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Mock the multi-site hook
const mockBuildUrl = jest.fn((path) => path)
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => {
    return jest.fn().mockImplementation(() => ({
        buildUrl: mockBuildUrl
    }))
})

const MockComponent = ({expectRedirect = false}) => {
    useExternalSearch()
    return (
        <div data-testid="mock-component-id">
            {expectRedirect ? 'should re-direct' : 'should not re-direct'}
        </div>
    )
}

MockComponent.propTypes = {
    expectRedirect: PropTypes.bool
}

const originalConsoleWarn = console.warn

beforeEach(() => {
    console.warn = jest.fn()
    mockBuildUrl.mockClear()
})

afterEach(() => {
    console.warn = originalConsoleWarn
})

describe('useExternalSearch', () => {
    describe('when query parameter is present', () => {
        test('re-directs to search page when "q" parameter is present', async () => {
            window.history.pushState({}, '', '/?q=test+query')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith('/search?q=test%20query')
            })

            expect(window.location.pathname).toBe('/search')
            expect(window.location.search).toBe('?q=test%20query')
        })

        test('re-directs to search page when "search" parameter present', async () => {
            window.history.pushState({}, '', '/?search=another+query')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith('/search?q=another%20query')
            })

            expect(window.location.pathname).toBe('/search')
            expect(window.location.search).toBe('?q=another%20query')
        })

        test('re-directs to search page when "query" parameter is present', async () => {
            window.history.pushState({}, '', '/?query=third+query')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith('/search?q=third%20query')
            })

            expect(window.location.pathname).toBe('/search')
            expect(window.location.search).toBe('?q=third%20query')
        })

        test('trims whitespace from query parameter', async () => {
            window.history.pushState({}, '', '/?q=%20%20trimmed%20query%20%20')
            renderWithProviders(<MockComponent expectRedirect />)
            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith('/search?q=trimmed%20query')
            })
        })
    })

    describe('does not redirect when', () => {
        test('query is empty string', () => {
            window.history.pushState({}, '', '/?q=')
            renderWithProviders(<MockComponent />)
            expect(mockBuildUrl).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/')
        })

        test('query is only whitespace', () => {
            window.history.pushState({}, '', '/?q=%20%20%20')
            renderWithProviders(<MockComponent />)
            expect(mockBuildUrl).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/')
        })

        test('no query parameters are present', () => {
            window.history.pushState({}, '', '/')
            renderWithProviders(<MockComponent />)
            expect(mockBuildUrl).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/')
        })

        test('already on search page', () => {
            window.history.pushState({}, '', '/search?q=existing-query')
            renderWithProviders(<MockComponent />)
            expect(mockBuildUrl).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/search')
        })

        test('on nested search page', () => {
            window.history.pushState({}, '', '/search/category?q=existing-query')
            renderWithProviders(<MockComponent />)
            expect(mockBuildUrl).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/search/category')
        })
    })

    describe('multiple query parameters with different formats', () => {
        test('handles URL encoded query parameters', async () => {
            window.history.pushState({}, '', '/?q=search%20with%20spaces%20and%20%26%20symbols')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith(
                    '/search?q=search%20with%20spaces%20and%20%26%20symbols'
                )
            })
        })

        test('handles plus-encoded spaces', async () => {
            window.history.pushState({}, '', '/?q=search+with+plus+spaces')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith('/search?q=search%20with%20plus%20spaces')
            })
        })
    })

    describe('utility function', () => {
        test('calls buildUrl with correct query parameter', async () => {
            window.history.pushState({}, '', '/?q=utility+test')
            renderWithProviders(<MockComponent expectRedirect />)
            await waitFor(() => {
                expect(mockBuildUrl).toHaveBeenCalledWith('/search?q=utility%20test')
                expect(mockBuildUrl).toHaveBeenCalledTimes(1)
            })
        })
    })
})
