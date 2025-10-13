/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {useEvaluateProducts} from '@salesforce/retail-react-app/app/hooks/use-evaluate-products'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

// Mock fetch globally
global.fetch = jest.fn()

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCommerceApi: jest.fn(() => ({
            clientConfig: {
                organizationId: 'test-org',
                shortCode: 'test-short-code',
                siteId: 'test-site',
                parameters: {
                    clientId: 'test-client-id'
                }
            },
            auth: {
                ready: jest.fn().mockResolvedValue({
                    access_token: 'test-token-123'
                })
            }
        }))
    }
})

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        app: {
            commerceAPI: {
                proxyPath: '/mobify/proxy/api'
            }
        }
    }))
}))

const MockComponent = ({promotionId, enabled = true}) => {
    const {data, isLoading, error} = useEvaluateProducts(
        {
            promotionId,
            promotionProductType: 'bonus'
        },
        {enabled}
    )

    if (isLoading) return <div data-testid="loading">Loading...</div>
    if (error) return <div data-testid="error">{error.message}</div>

    return (
        <div>
            <div data-testid="products-count">{data?.data?.length || 0}</div>
            <div data-testid="products-total">{data?.total || 0}</div>
        </div>
    )
}

describe('useEvaluateProducts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch.mockClear()
    })

    test('🔍 fetches products successfully', async () => {
        const mockResponse = {
            data: [
                {productId: 'product-1', productName: 'Test Product 1'},
                {productId: 'product-2', productName: 'Test Product 2'}
            ],
            total: 2,
            limit: 10,
            offset: 0
        }

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('2')
            expect(screen.getByTestId('products-total')).toHaveTextContent('2')
        })

        expect(global.fetch).toHaveBeenCalledWith(
            '/mobify/proxy/api/organizations/test-org/promotions/actions/evaluate-products',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token-123'
                }),
                body: JSON.stringify({
                    promotionId: 'test-promotion-id',
                    promotionProductType: 'bonus'
                })
            })
        )
    })

    test('handles API errors gracefully', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server error occurred'
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            const errorElement = screen.getByTestId('error')
            expect(errorElement).toBeInTheDocument()
            expect(errorElement.textContent).toContain('500')
        })
    })

    test('⏸does not fetch when enabled is false', async () => {
        renderWithProviders(<MockComponent promotionId="test-promotion-id" enabled={false} />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
        })

        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('⏸does not fetch when promotionId is missing', async () => {
        renderWithProviders(<MockComponent promotionId="" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
        })

        expect(global.fetch).not.toHaveBeenCalled()
    })

    test('includes pagination parameters when provided', async () => {
        const mockResponse = {
            data: [{productId: 'product-1'}],
            total: 100,
            limit: 25,
            offset: 50
        }

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        })

        const MockComponentWithPagination = () => {
            const {data} = useEvaluateProducts({
                promotionId: 'test-promotion-id',
                promotionProductType: 'bonus',
                limit: 25,
                offset: 50
            })

            return <div data-testid="products-total">{data?.total || 0}</div>
        }

        renderWithProviders(<MockComponentWithPagination />)

        await waitFor(() => {
            expect(screen.getByTestId('products-total')).toHaveTextContent('100')
        })

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({
                    promotionId: 'test-promotion-id',
                    promotionProductType: 'bonus',
                    limit: 25,
                    offset: 50
                })
            })
        )
    })

    test('handles missing auth token', async () => {
        // Override the mock for this test
        const {useCommerceApi} = require('@salesforce/commerce-sdk-react')
        useCommerceApi.mockReturnValueOnce({
            clientConfig: {
                organizationId: 'test-org',
                shortCode: 'test-short-code',
                siteId: 'test-site',
                parameters: {clientId: 'test-client-id'}
            },
            auth: {
                ready: jest.fn().mockResolvedValue({
                    access_token: null // No token
                })
            }
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            const errorElement = screen.getByTestId('error')
            expect(errorElement).toBeInTheDocument()
            expect(errorElement.textContent).toContain('authentication token')
        })
    })
})
