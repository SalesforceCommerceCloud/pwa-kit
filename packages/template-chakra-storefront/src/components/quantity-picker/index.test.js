/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {act, screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import QuantityPicker from './index'

const MockComponent = () => {
    const [quantity, setQuantity] = useState(5)
    return (
        <QuantityPicker
            value={quantity}
            onValueChange={({value, valueAsNumber}) => setQuantity(valueAsNumber)}
        />
    )
}

const MINUS = '\u2212' // HTML `&minus;`, not the same as '-' (\u002d)

describe('QuantityPicker', () => {
    test('clicking plus increments value', async () => {
        const {user} = renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByText('+')
        await act(async () => {
            await user.click(button)
        })
        await waitFor(() => {
            expect(input.value).toBe('6')
        })
    })
    test('clicking minus decrements value', async () => {
        const {user} = renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByText(MINUS)
        await act(async () => {
            await user.click(button)
        })
        await waitFor(() => {
            expect(input.value).toBe('4')
        })
    })
    test('arrow keys increment/decrement value when input is focused', async () => {
        const {user} = renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        await act(async () => {
            await user.click(input)
            await user.keyboard('{ArrowUp}')
        })
        await waitFor(() => {
            expect(input.value).toBe('6')
        })
        await act(async () => {
            await user.keyboard('{ArrowDown}')
        })
        await waitFor(() => {
            expect(input.value).toBe('5')
        })
    })
    test('input can be focused and accepts direct input', async () => {
        const {user} = renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        await act(async () => {
            await user.click(input)
            await user.clear(input)
            await user.type(input, '10')
        })
        await waitFor(() => {
            expect(input.value).toBe('10')
        })
    })
    test('input is focusable and accessible', async () => {
        const {user} = renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        await act(async () => {
            await user.click(input)
        })
        expect(input).toHaveFocus()
        expect(input).toHaveAttribute('aria-label', 'Quantity')
    })
    test('buttons have proper accessibility attributes', async () => {
        renderWithProviders(<MockComponent />)
        const incrementButton = screen.getByText('+')
        const decrementButton = screen.getByText(MINUS)

        expect(incrementButton).toHaveAttribute('aria-label', 'increment value')
        expect(decrementButton).toHaveAttribute('aria-label', 'decrease value')
        expect(incrementButton).toHaveAttribute('data-testid', 'quantity-increment')
        expect(decrementButton).toHaveAttribute('data-testid', 'quantity-decrement')
    })
})
