/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {useRuleBasedBonusProducts} from '@salesforce/retail-react-app/app/hooks/use-rule-based-bonus-products'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useProductSearch: jest.fn()
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

describe('useRuleBasedBonusProducts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('🔍 fetches products successfully using useProductSearch', async () => {
        const mockData = {
            hits: [
                {productId: 'product-1', productName: 'Bonus Product 1'},
                {productId: 'product-2', productName: 'Bonus Product 2'}
            ],
            total: 2
        }

        useProductSearch.mockReturnValue({
            data: mockData,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('2')
            expect(screen.getByTestId('products-total')).toHaveTextContent('2')
            expect(screen.getByTestId('product-product-1')).toHaveTextContent('Bonus Product 1')
            expect(screen.getByTestId('product-product-2')).toHaveTextContent('Bonus Product 2')
        })

        expect(useProductSearch).toHaveBeenCalledWith(
            {
                parameters: {
                    promotionId: 'test-promotion-id',
                    limit: 25,
                    offset: 0
                }
            },
            {
                enabled: true
            }
        )
    })

    test('does not fetch when enabled is false', async () => {
        useProductSearch.mockReturnValue({
            data: null,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" enabled={false} />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
        })

        expect(useProductSearch).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                enabled: false
            })
        )
    })

    test('does not fetch when promotionId is missing', async () => {
        useProductSearch.mockReturnValue({
            data: null,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
        })

        expect(useProductSearch).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                enabled: false
            })
        )
    })

    test('includes pagination parameters when provided', async () => {
        const mockData = {
            hits: [{productId: 'product-1', productName: 'Product 1'}],
            total: 100
        }

        useProductSearch.mockReturnValue({
            data: mockData,
            isLoading: false,
            error: null
        })

        renderWithProviders(
            <MockComponent promotionId="test-promotion-id" limit={50} offset={25} />
        )

        await waitFor(() => {
            expect(screen.getByTestId('products-total')).toHaveTextContent('100')
        })

        expect(useProductSearch).toHaveBeenCalledWith(
            {
                parameters: {
                    promotionId: 'test-promotion-id',
                    limit: 50,
                    offset: 25
                }
            },
            {
                enabled: true
            }
        )
    })

    test('handles API errors gracefully', async () => {
        const mockError = new Error('API Error: 500')

        useProductSearch.mockReturnValue({
            data: null,
            isLoading: false,
            error: mockError
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            const errorElement = screen.getByTestId('error')
            expect(errorElement).toBeInTheDocument()
            expect(errorElement.textContent).toContain('API Error: 500')
        })
    })

    test('⏳ shows loading state', async () => {
        useProductSearch.mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toBeInTheDocument()
            expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
        })
    })

    test('returns empty array when no products found', async () => {
        useProductSearch.mockReturnValue({
            data: {hits: [], total: 0},
            isLoading: false,
            error: null
        })

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

        useProductSearch.mockReturnValue({
            data: mockData,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('1')
        })

        expect(useProductSearch).toHaveBeenCalledWith(
            {
                parameters: {
                    promotionId: 'test-promotion-id',
                    limit: 25, // Default value
                    offset: 0 // Default value
                }
            },
            {
                enabled: true
            }
        )
    })
})
