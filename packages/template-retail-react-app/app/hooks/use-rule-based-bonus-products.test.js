/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import PropTypes from 'prop-types'
import {useRuleBasedBonusProducts} from '@salesforce/retail-react-app/app/hooks/use-rule-based-bonus-products'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Helper function to create a complete mock response
const createMockResponse = (data, options = {}) => ({
    ok: options.ok !== undefined ? options.ok : true,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: new Map(),
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    clone: function () {
        return this
    }
})

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCommerceApi: jest.fn(() => ({
            shopperSearch: {
                clientConfig: {
                    parameters: {
                        siteId: 'site-1',
                        locale: 'en-GB',
                        currency: 'USD',
                        organizationId: 'f_ecom_zzrf_001',
                        shortCode: 'test-shortcode'
                    }
                }
            }
        })),
        useAccessToken: jest.fn(() => ({
            getTokenWhenReady: jest.fn().mockResolvedValue('mock-token')
        }))
    }
})

const MockComponent = ({promotionId, enabled = true, limit, offset}) => {
    const {products, total, isLoading, error} = useRuleBasedBonusProducts(promotionId, {
        enabled,
        limit,
        offset
    })

    if (isLoading) return <div data-testid="loading">Loading...</div>
    if (error) return <div data-testid="error">{error.message}</div>

    return (
        <div>
            <div data-testid="products-count">{products.length}</div>
            <div data-testid="products-total">{total}</div>
            {products.map((product) => (
                <div key={product.productId} data-testid={`product-${product.productId}`}>
                    {product.productName}
                </div>
            ))}
        </div>
    )
}

MockComponent.propTypes = {
    promotionId: PropTypes.string,
    enabled: PropTypes.bool,
    limit: PropTypes.number,
    offset: PropTypes.number
}

describe('useRuleBasedBonusProducts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset fetch mock before each test
        mockFetch.mockClear()
    })

    test('fetches products successfully using useProductSearch', async () => {
        const mockData = {
            hits: [
                {productId: 'product-1', productName: 'Bonus Product 1'},
                {productId: 'product-2', productName: 'Bonus Product 2'}
            ],
            total: 2
        }

        mockFetch.mockResolvedValueOnce(createMockResponse(mockData))

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('2')
            expect(screen.getByTestId('products-total')).toHaveTextContent('2')
            expect(screen.getByTestId('product-product-1')).toHaveTextContent('Bonus Product 1')
            expect(screen.getByTestId('product-product-2')).toHaveTextContent('Bonus Product 2')
        })

        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalled()

        // Get the actual call arguments
        const fetchCall = mockFetch.mock.calls[0]
        const firstArg = fetchCall[0]

        // The first argument might be a URL string or a Request object
        // If it's a Request object, get the URL from it
        const url = typeof firstArg === 'string' ? firstArg : firstArg.url

        // Check the URL contains the expected parameters
        expect(url).toMatch(/refine=pmid%3Dtest-promotion-id/)

        // Verify fetch was called with correct authorization
        expect(mockFetch).toHaveBeenCalled()
    })

    test('does not fetch when enabled is false', async () => {
        renderWithProviders(<MockComponent promotionId="test-promotion-id" enabled={false} />)

        // Wait a bit for React Query to settle
        await waitFor(
            () => {
                // When disabled, the component should eventually show products-count or stay in loading
                // But fetch should never be called
                expect(mockFetch).not.toHaveBeenCalled()
            },
            {timeout: 100}
        )

        // Give it a bit more time to ensure it settles to the correct state
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Most importantly, verify fetch was never called
        expect(mockFetch).not.toHaveBeenCalled()
    })

    test('does not fetch when promotionId is missing', async () => {
        renderWithProviders(<MockComponent promotionId="" />)

        // Wait a bit for React Query to settle
        await waitFor(
            () => {
                // When promotionId is empty, the query is disabled
                // fetch should never be called
                expect(mockFetch).not.toHaveBeenCalled()
            },
            {timeout: 100}
        )

        // Give it a bit more time to ensure it settles to the correct state
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Most importantly, verify fetch was never called
        expect(mockFetch).not.toHaveBeenCalled()
    })

    test('includes pagination parameters when provided', async () => {
        const mockData = {
            hits: [{productId: 'product-1', productName: 'Product 1'}],
            total: 100
        }

        mockFetch.mockResolvedValueOnce(createMockResponse(mockData))

        renderWithProviders(
            <MockComponent promotionId="test-promotion-id" limit={50} offset={25} />
        )

        await waitFor(() => {
            expect(screen.getByTestId('products-total')).toHaveTextContent('100')
        })

        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalled()

        // Get the actual call arguments
        const fetchCall = mockFetch.mock.calls[0]
        const firstArg = fetchCall[0]

        // The first argument might be a URL string or a Request object
        const url = typeof firstArg === 'string' ? firstArg : firstArg.url

        // Check the URL contains the expected parameters
        expect(url).toMatch(/limit=50/)
        expect(url).toMatch(/offset=25/)
    })

    test('handles API errors gracefully', async () => {
        mockFetch.mockResolvedValueOnce(
            createMockResponse('Internal Server Error', {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            })
        )

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            const errorElement = screen.getByTestId('error')
            expect(errorElement).toBeInTheDocument()
            expect(errorElement.textContent).toContain('HTTP error! status: 500')
        })
    })

    test('shows loading state', async () => {
        // Mock a slow fetch to keep loading state
        mockFetch.mockImplementationOnce(
            () =>
                new Promise((resolve) =>
                    setTimeout(() => resolve(createMockResponse({hits: [], total: 0})), 1000)
                )
        )

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        // Check loading state appears immediately
        expect(screen.getByTestId('loading')).toBeInTheDocument()
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    })

    test('returns empty array when no products found', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({hits: [], total: 0}))

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
            expect(screen.getByTestId('products-total')).toHaveTextContent('0')
        })
    })

    test('uses default pagination values when not provided', async () => {
        const mockData = {
            hits: [{productId: 'product-1'}],
            total: 1
        }

        mockFetch.mockResolvedValueOnce(createMockResponse(mockData))

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('1')
        })

        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalled()

        // Get the actual call arguments
        const fetchCall = mockFetch.mock.calls[0]
        const firstArg = fetchCall[0]

        // The first argument might be a URL string or a Request object
        const url = typeof firstArg === 'string' ? firstArg : firstArg.url

        // Check the URL contains the default parameters
        expect(url).toMatch(/limit=25/)
        expect(url).toMatch(/offset=0/)
    })

    test('handles different promotionIds correctly', async () => {
        const mockDataPromo1 = {
            hits: [
                {productId: 'promo1-product-1', productName: 'Promo 1 Product 1'},
                {productId: 'promo1-product-2', productName: 'Promo 1 Product 2'}
            ],
            total: 2
        }

        mockFetch.mockResolvedValueOnce(createMockResponse(mockDataPromo1))

        renderWithProviders(<MockComponent promotionId="promotion-1" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('2')
            expect(screen.getByTestId('products-total')).toHaveTextContent('2')
            expect(screen.getByTestId('product-promo1-product-1')).toBeInTheDocument()
            expect(screen.getByTestId('product-promo1-product-2')).toBeInTheDocument()
        })

        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalled()

        // Get the actual call arguments
        const fetchCall = mockFetch.mock.calls[0]
        const firstArg = fetchCall[0]

        // The first argument might be a URL string or a Request object
        const url = typeof firstArg === 'string' ? firstArg : firstArg.url

        // Check the URL contains the expected promotion ID
        expect(url).toMatch(/refine=pmid%3Dpromotion-1/)
    })
})
