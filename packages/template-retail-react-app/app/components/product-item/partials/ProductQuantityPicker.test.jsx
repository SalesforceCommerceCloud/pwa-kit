/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {MemoryRouter} from 'react-router-dom'
import ProductQuantityPicker from '@salesforce/retail-react-app/app/components/product-item/partials/ProductQuantityPicker'

// Mock the hooks that use router context
jest.mock('@salesforce/retail-react-app/app/hooks/use-variant', () => ({
    useVariant: () => null
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-variation-params', () => ({
    useVariationParams: () => ({})
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-variation-attributes', () => ({
    useVariationAttributes: () => []
}))

const mockProduct = {
    id: 'test-id',
    quantity: 2,
    name: 'Test Product',
    inventory: {
        stockLevel: 10
    }
}

const mockSetQuantity = jest.fn()
const mockOnItemQuantityChange = jest.fn()

const renderWithIntl = (component) => {
    return render(
        <MemoryRouter>
            <IntlProvider locale="en" messages={{}}>
                {component}
            </IntlProvider>
        </MemoryRouter>
    )
}

describe('ProductQuantityPicker', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders quantity label and picker', () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={2}
                setQuantity={mockSetQuantity}
            />
        )
        expect(screen.getByText('Quantity:')).toBeInTheDocument()
        expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })

    test('handles quantity change', async () => {
        mockOnItemQuantityChange.mockResolvedValue(true)
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={2}
                setQuantity={mockSetQuantity}
            />
        )
        const input = screen.getByRole('spinbutton')
        fireEvent.change(input, {target: {value: '3'}})
        await waitFor(() => {
            expect(mockOnItemQuantityChange).toHaveBeenCalledWith(3)
            expect(mockSetQuantity).toHaveBeenCalledWith(3)
        })
    })

    test('has correct aria label', () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={2}
                setQuantity={mockSetQuantity}
            />
        )
        const element = screen.getByText('Quantity:')
        expect(element).toHaveAttribute(
            'aria-label',
            'Quantity selector for Test Product. Selected quantity is 2'
        )
    })

    test('handles empty input', () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={2}
                setQuantity={mockSetQuantity}
            />
        )
        const input = screen.getByRole('spinbutton')
        fireEvent.change(input, {target: {value: ''}})
        expect(mockSetQuantity).toHaveBeenCalledWith('')
    })

    test('handles invalid input', () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={2}
                setQuantity={mockSetQuantity}
            />
        )
        const input = screen.getByRole('spinbutton')
        fireEvent.change(input, {target: {value: '-1'}})
        expect(mockOnItemQuantityChange).not.toHaveBeenCalled()
    })
})
