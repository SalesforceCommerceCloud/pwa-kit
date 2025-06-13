/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import ProductQuantityPicker from '@salesforce/retail-react-app/app/components/product-item/product-quantity-picker'

const mockProduct = {name: 'Test Product', quantity: 1}
const mockOnItemQuantityChange = jest.fn(() => Promise.resolve(true))
const mockSetQuantity = jest.fn()

const renderWithIntl = (component) =>
    render(
        <IntlProvider locale="en" defaultLocale="en">
            {component}
        </IntlProvider>
    )

describe('ProductQuantityPicker', () => {
    test('renders the quantity label', () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={1}
                setQuantity={mockSetQuantity}
            />
        )
        expect(screen.getByText(/Quantity:/i)).toBeInTheDocument()
    })

    test('calls onItemQuantityChange when quantity is changed', async () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={1}
                setQuantity={mockSetQuantity}
            />
        )
        const input = screen.getByRole('spinbutton')
        fireEvent.change(input, {target: {value: '2'}})
        await waitFor(() => {
            expect(mockOnItemQuantityChange).toHaveBeenCalledWith(2)
        })
    })

    test('sets quantity to empty string when input is cleared', () => {
        renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={1}
                setQuantity={mockSetQuantity}
            />
        )
        const input = screen.getByRole('spinbutton')
        fireEvent.change(input, {target: {value: ''}})
        expect(mockSetQuantity).toHaveBeenCalledWith('')
    })

    test('restores previous quantity on blur with empty value', async () => {
        const {getByRole} = renderWithIntl(
            <ProductQuantityPicker
                product={mockProduct}
                onItemQuantityChange={mockOnItemQuantityChange}
                stepQuantity={1}
                quantity={''}
                setQuantity={mockSetQuantity}
            />
        )
        const input = getByRole('spinbutton')
        fireEvent.change(input, {target: {value: ''}})
        fireEvent.blur(input)
        await waitFor(() => {
            expect(mockSetQuantity).toHaveBeenCalledWith(1)
        })
    })
})
