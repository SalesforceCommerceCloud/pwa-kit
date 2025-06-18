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
import {searchUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

jest.mock('@salesforce/retail-react-app/app/utils/url', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/utils/url'),
    searchUrlBuilder: jest.fn((query) => `/search?q=${encodeURIComponent(query)}`)
}))

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
    jest.clearAllMocks()
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
                expect(searchUrlBuilder).toHaveBeenCalledWith('test query')
            })

            expect(window.location.pathname).toBe('/search')
            expect(window.location.search).toBe('?q=test%20query')
        })

        test('re-directs to search page when "search" parameter present', async () => {
            window.history.pushState({}, '', '/?search=another+query')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(searchUrlBuilder).toHaveBeenCalledWith('another query')
            })

            expect(window.location.pathname).toBe('/search')
            expect(window.location.search).toBe('?q=another%20query')
        })

        test('re-directs to search page when "query" parameter is present', async () => {
            window.history.pushState({}, '', '/?query=third+query')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(searchUrlBuilder).toHaveBeenCalledWith('third query')
            })

            expect(window.location.pathname).toBe('/search')
            expect(window.location.search).toBe('?q=third%20query')
        })

        test('trims whitespace from query parameter', async () => {
            window.history.pushState({}, '', '/?q=%20%20trimmed%20query%20%20')
            renderWithProviders(<MockComponent expectRedirect />)
            await waitFor(() => {
                expect(searchUrlBuilder).toHaveBeenCalledWith('trimmed query')
            })
        })
    })

    describe('does not redirect when', () => {
        test('query is empty string', () => {
            window.history.pushState({}, '', '/?q=')
            renderWithProviders(<MockComponent />)
            expect(searchUrlBuilder).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/')
        })

        test('query is only whitespace', () => {
            window.history.pushState({}, '', '/?q=%20%20%20')
            renderWithProviders(<MockComponent />)
            expect(searchUrlBuilder).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/')
        })

        test('no query parameters are present', () => {
            window.history.pushState({}, '', '/')
            renderWithProviders(<MockComponent />)
            expect(searchUrlBuilder).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/')
        })

        test('already on search page', () => {
            window.history.pushState({}, '', '/search?q=existing-query')
            renderWithProviders(<MockComponent />)
            expect(searchUrlBuilder).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/search')
        })

        test('on nested search page', () => {
            window.history.pushState({}, '', '/search/category?q=existing-query')
            renderWithProviders(<MockComponent />)
            expect(searchUrlBuilder).not.toHaveBeenCalled()
            expect(window.location.pathname).toBe('/search/category')
        })
    })

    describe('multiple query parameters with different formats', () => {
        test('handles URL encoded query parameters', async () => {
            window.history.pushState({}, '', '/?q=search%20with%20spaces%20and%20%26%20symbols')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(searchUrlBuilder).toHaveBeenCalledWith('search with spaces and & symbols')
            })
        })

        test('handles plus-encoded spaces', async () => {
            window.history.pushState({}, '', '/?q=search+with+plus+spaces')
            renderWithProviders(<MockComponent expectRedirect />)

            await waitFor(() => {
                expect(searchUrlBuilder).toHaveBeenCalledWith('search with plus spaces')
            })
        })
    })

    describe('utility function', () => {
        test('calls searchUrlBuilder with correct query parameter', async () => {
            window.history.pushState({}, '', '/?q=utility+test')
            renderWithProviders(<MockComponent expectRedirect />)
            await waitFor(() => {
                expect(searchUrlBuilder).toHaveBeenCalledWith('utility test')
                expect(searchUrlBuilder).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('URL normalization utility functions', () => {
        const normalizeUrl = (url) => {
            if (typeof url === 'string' && url.includes('?')) {
                const questionMarks = (url.match(/\?/g) || []).length

                if (questionMarks > 1) {
                    const parts = url.split('?')
                    return parts[0] + '?' + parts.slice(1).join('&')
                }
            }
            return url
        }

        test('normalizes malformed URLs with multiple question marks', () => {
            const malformedUrl = '/product/123?color=red?size=large?category=clothing'
            const normalized = normalizeUrl(malformedUrl)
            expect(normalized).toBe('/product/123?color=red&size=large&category=clothing')
        })

        test('handles URLs with mixed question marks and ampersands', () => {
            const malformedUrl = '/search?q=test?city=Boston&country=US?store=downtown'
            const normalized = normalizeUrl(malformedUrl)
            expect(normalized).toBe('/search?q=test&city=Boston&country=US&store=downtown')
        })

        test('leaves properly formatted URLs unchanged', () => {
            const properUrl = '/product/456?color=blue&size=medium&category=shoes'
            const normalized = normalizeUrl(properUrl)
            expect(normalized).toBe('/product/456?color=blue&size=medium&category=shoes')
        })

        test('handles URLs with no query parameters', () => {
            const simpleUrl = '/product/789'
            const normalized = normalizeUrl(simpleUrl)
            expect(normalized).toBe('/product/789')
        })

        test('handles URLs with encoded parameters and multiple question marks', () => {
            const malformedUrl = '/product/999?name=Modern%20Blazer?city=San%20Francisco?country=US'
            const normalized = normalizeUrl(malformedUrl)
            expect(normalized).toBe(
                '/product/999?name=Modern%20Blazer&city=San%20Francisco&country=US'
            )
        })

        test('handles complex URLs with many malformed parameters', () => {
            const complexUrl =
                '/store?city=Boston?state=MA?country=US?zip=02101?store=downtown?category=electronics'
            const normalized = normalizeUrl(complexUrl)
            expect(normalized).toBe(
                '/store?city=Boston&state=MA&country=US&zip=02101&store=downtown&category=electronics'
            )
        })

        test('returns non-string inputs unchanged', () => {
            expect(normalizeUrl(null)).toBeNull()
            expect(normalizeUrl(undefined)).toBeUndefined()
            expect(normalizeUrl(123)).toBe(123)
        })
    })
})
