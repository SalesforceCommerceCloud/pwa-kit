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

// Mock useProductSearch hook
const mockUseProductSearch = jest.fn()

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useProductSearch: (...args) => mockUseProductSearch(...args)
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
        mockUseProductSearch.mockClear()
    })

    test('fetches products successfully using useProductSearch', async () => {
        const mockData = {
            hits: [
                {productId: 'product-1', productName: 'Bonus Product 1'},
                {productId: 'product-2', productName: 'Bonus Product 2'}
            ],
            total: 2
        }

        mockUseProductSearch.mockReturnValue({
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

        // Verify useProductSearch was called with correct parameters
        expect(mockUseProductSearch).toHaveBeenCalled()
        const call = mockUseProductSearch.mock.calls[0]
        expect(call[0].parameters.refine).toEqual(['pmid=test-promotion-id', 'pmpt=bonus'])
        expect(call[0].parameters.limit).toBe(25)
        expect(call[0].parameters.offset).toBe(0)
    })

    test('does not fetch when enabled is false', async () => {
        mockUseProductSearch.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" enabled={false} />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
        })

        // Verify useProductSearch was called with enabled: false
        expect(mockUseProductSearch).toHaveBeenCalled()
        const call = mockUseProductSearch.mock.calls[0]
        expect(call[1].enabled).toBe(false)
    })

    test('does not fetch when promotionId is missing', async () => {
        mockUseProductSearch.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('0')
        })

        // Verify useProductSearch was called with enabled: false (because promotionId is empty)
        expect(mockUseProductSearch).toHaveBeenCalled()
        const call = mockUseProductSearch.mock.calls[0]
        expect(call[1].enabled).toBe(false)
    })

    test('includes pagination parameters when provided', async () => {
        const mockData = {
            hits: [{productId: 'product-1', productName: 'Product 1'}],
            total: 100
        }

        mockUseProductSearch.mockReturnValue({
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

        // Verify useProductSearch was called with correct parameters
        expect(mockUseProductSearch).toHaveBeenCalled()
        const call = mockUseProductSearch.mock.calls[0]
        expect(call[0].parameters.limit).toBe(50)
        expect(call[0].parameters.offset).toBe(25)
    })

    test('handles API errors gracefully', async () => {
        const mockError = new Error('HTTP error! status: 500')

        mockUseProductSearch.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: mockError
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            const errorElement = screen.getByTestId('error')
            expect(errorElement).toBeInTheDocument()
            expect(errorElement.textContent).toContain('HTTP error! status: 500')
        })
    })

    test('shows loading state', async () => {
        mockUseProductSearch.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        // Check loading state appears immediately
        expect(screen.getByTestId('loading')).toBeInTheDocument()
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    })

    test('returns empty array when no products found', async () => {
        mockUseProductSearch.mockReturnValue({
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

        mockUseProductSearch.mockReturnValue({
            data: mockData,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="test-promotion-id" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('1')
        })

        // Verify useProductSearch was called with default parameters
        expect(mockUseProductSearch).toHaveBeenCalled()
        const call = mockUseProductSearch.mock.calls[0]
        expect(call[0].parameters.limit).toBe(25)
        expect(call[0].parameters.offset).toBe(0)
    })

    test('handles different promotionIds correctly', async () => {
        const mockDataPromo1 = {
            hits: [
                {productId: 'promo1-product-1', productName: 'Promo 1 Product 1'},
                {productId: 'promo1-product-2', productName: 'Promo 1 Product 2'}
            ],
            total: 2
        }

        mockUseProductSearch.mockReturnValue({
            data: mockDataPromo1,
            isLoading: false,
            error: null
        })

        renderWithProviders(<MockComponent promotionId="promotion-1" />)

        await waitFor(() => {
            expect(screen.getByTestId('products-count')).toHaveTextContent('2')
            expect(screen.getByTestId('products-total')).toHaveTextContent('2')
            expect(screen.getByTestId('product-promo1-product-1')).toBeInTheDocument()
            expect(screen.getByTestId('product-promo1-product-2')).toBeInTheDocument()
        })

        // Verify useProductSearch was called with correct promotion ID
        expect(mockUseProductSearch).toHaveBeenCalled()
        const call = mockUseProductSearch.mock.calls[0]
        expect(call[0].parameters.refine).toEqual(['pmid=promotion-1', 'pmpt=bonus'])
    })
})
