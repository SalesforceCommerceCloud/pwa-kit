/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import React from 'react'
import {screen, within, fireEvent} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import CartQuantityPicker from '.'
import {noop} from '../../commerce-api/utils'

const mockCartProduct = {
    adjustedTax: 5.06,
    basePrice: 53.11,
    bonusProductLineItem: false,
    gift: false,
    itemId: 'c5f3f5a8a5e745f4e4027b45dd',
    itemText: 'Long Center Seam Skirt',
    price: 106.22,
    priceAfterItemDiscount: 106.22,
    priceAfterOrderDiscount: 106.22,
    productId: '701642842620M',
    productName: 'Long Center Seam Skirt',
    quantity: 1,
    shipmentId: 'me',
    tax: 5.06,
    taxBasis: 106.22,
    taxClassId: 'standard',
    taxRate: 0.05
}

test('Expect Quantity Picker to Show correct quanitt on load', async () => {
    const picker = renderWithProviders(
        <CartQuantityPicker
            product={mockCartProduct}
            handleRemoveItem={() => noop}
            onItemQuantityChange={() => noop}
        />
    )

    expect(await picker.getByDisplayValue('1'))
})

test('Expect Quantity Picker to Increment on plus button press', async () => {
    const picker = renderWithProviders(
        <CartQuantityPicker
            product={mockCartProduct}
            handleRemoveItem={() => noop}
            onItemQuantityChange={() => noop}
        />
    )

    expect(await picker.getByDisplayValue('1'))

    const incrementButton = await picker.findByTestId('cart-quantity-increment')

    // update item quantity
    fireEvent.click(incrementButton)

    expect(await picker.getByDisplayValue('2'))
})

test('Expect Quantity Picker to Decrement on minus button press', async () => {
    const picker = renderWithProviders(
        <CartQuantityPicker
            product={mockCartProduct}
            handleRemoveItem={() => noop}
            onItemQuantityChange={() => noop}
        />
    )

    expect(await picker.getByDisplayValue('1'))

    const decrementButton = await picker.findByTestId('cart-quantity-decrement')

    // update item quantity
    fireEvent.click(decrementButton)
    expect(await picker.getByDisplayValue('1'))
})

test('Expect Quantity Picker to Decrement on minus button press', async () => {
    const picker = renderWithProviders(
        <CartQuantityPicker
            product={mockCartProduct}
            handleRemoveItem={() => noop}
            onItemQuantityChange={() => noop}
        />
    )

    expect(await picker.getByDisplayValue('1'))

    const decrementButton = await picker.findByTestId('cart-quantity-decrement')

    // update item quantity
    fireEvent.click(decrementButton)
    expect(await picker.getByDisplayValue('1'))
    expect(await picker.getByText('Are you sure you want to remove this item from your cart?'))
})

test('Expect Quantity Picker to change when type and press enter', async () => {
    const picker = renderWithProviders(
        <CartQuantityPicker
            product={mockCartProduct}
            handleRemoveItem={() => noop}
            onItemQuantityChange={() => noop}
        />
    )

    expect(await picker.getByDisplayValue('1'))

    const quantityInput = document.querySelector('input[type="numeric"]')
    await user.type(quantityInput, '{backspace}12{enter}')

    // update item quantity
    expect(await picker.getByDisplayValue('12'))
})
