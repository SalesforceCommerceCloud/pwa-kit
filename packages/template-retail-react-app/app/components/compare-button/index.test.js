/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CompareButton from '@salesforce/retail-react-app/app/components/compare-button'
import {ComparisonProvider} from '@salesforce/retail-react-app/app/contexts'
import mockProductHit from '@salesforce/retail-react-app/app/mocks/product-search-hit'

const MockedComponent = ({product, ...props}) => (
    <ComparisonProvider>
        <CompareButton product={product} {...props} />
    </ComparisonProvider>
)

describe('CompareButton', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders icon button variant by default', () => {
        renderWithProviders(<MockedComponent product={mockProductHit} />)
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('Add'))
    })

    test('renders regular button variant', () => {
        renderWithProviders(<MockedComponent product={mockProductHit} variant="button" />)
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent('Compare')
    })

    test('handles click to add product to comparison', async () => {
        const {user} = renderWithProviders(<MockedComponent product={mockProductHit} />)
        
        const button = screen.getByRole('button')
        await user.click(button)

        // Should show success toast
        expect(screen.getByText(/added to comparison/i)).toBeInTheDocument()
    })

    test('shows different state when product is already in comparison', async () => {
        const {user} = renderWithProviders(<MockedComponent product={mockProductHit} />)
        
        const button = screen.getByRole('button')
        
        // Add to comparison first
        await user.click(button)
        
        // Button should now show "comparing" state
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('Remove'))
    })

    test('handles click to remove product from comparison', async () => {
        const {user} = renderWithProviders(<MockedComponent product={mockProductHit} />)
        
        const button = screen.getByRole('button')
        
        // Add to comparison first
        await user.click(button)
        
        // Click again to remove
        await user.click(button)
        
        // Should show removal toast
        expect(screen.getByText(/removed from comparison/i)).toBeInTheDocument()
    })

    test('prevents adding when maximum products reached', async () => {
        const {user} = renderWithProviders(
            <ComparisonProvider>
                <CompareButton product={{...mockProductHit, productId: 'product-1'}} />
                <CompareButton product={{...mockProductHit, productId: 'product-2'}} />
                <CompareButton product={{...mockProductHit, productId: 'product-3'}} />
                <CompareButton product={{...mockProductHit, productId: 'product-4'}} />
                <CompareButton product={{...mockProductHit, productId: 'product-5'}} />
            </ComparisonProvider>
        )
        
        const buttons = screen.getAllByRole('button')
        
        // Add 4 products
        for (let i = 0; i < 4; i++) {
            await user.click(buttons[i])
        }
        
        // Try to add 5th product - should show warning
        await user.click(buttons[4])
        
        expect(screen.getByText(/Maximum 4 products/i)).toBeInTheDocument()
    })
})
