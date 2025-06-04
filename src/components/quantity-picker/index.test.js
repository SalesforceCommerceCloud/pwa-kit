/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {act, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import QuantityPicker from './index'

const MockComponent = () => {
    const [quantity, setQuantity] = useState(5)
    return (
        <QuantityPicker
            value={quantity}
            onValueChange={({value, valueAsNumber}) => {
                setQuantity(valueAsNumber)
            }}
        />
    )
}

describe('QuantityPicker', () => {
    test('clicking plus increments value', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByTestId('quantity-increment')

        await act(async () => {
            await user.click(button)
        })

        await waitFor(() => {
            expect(input.value).toBe('6')
        })
    })
    test('clicking minus decrements value', async () => {
        const user = userEvent.setup()
        renderWithProviders(<MockComponent />)
        const input = screen.getByRole('spinbutton')
        const button = screen.getByTestId('quantity-decrement')

        await act(async () => {
            await user.click(button)
        })

        await waitFor(() => {
            expect(input.value).toBe('4')
        })
    })
})
