/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker/index'

const MockComponent = () => {
    const [quantity, setQuantity] = useState(5)
    return <QuantityPicker value={quantity} onChange={(str, num) => setQuantity(num)} />
}

const MINUS = '\u2212' // HTML `&minus;`, not the same as '-' (\u002d)

describe('QuantityPicker', () => {
    test('clicking plus increments value', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByText('+')
        await user.click(button)
        expect(input.value).toBe('6')
    })
    test('clicking minus decrements value', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByText(MINUS)
        await user.click(button)
        expect(input.value).toBe('4')
    })
    test('hitting enter/space on plus increments value', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByText('+')
        await user.type(button, '{enter}')
        expect(input.value).toBe('6')
        await user.type(button, '{space}')
        expect(input.value).toBe('7')
    })
    test('hitting space on minus decrements value', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByText(MINUS)
        await user.type(button, '{enter}')
        expect(input.value).toBe('4')
        await user.type(button, '{space}')
        expect(input.value).toBe('3')
    })
    test('plus button is tabbable', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        await user.type(input, '{tab}')
        const button = screen.getByText('+')
        expect(button).toHaveFocus()
    })
    test('minus button is tabbable', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        await user.type(input, '{shift>}{tab}') // > modifier in {shift>} means "keep key pressed"
        const button = screen.getByText(MINUS)
        expect(button).toHaveFocus()
    })
})
