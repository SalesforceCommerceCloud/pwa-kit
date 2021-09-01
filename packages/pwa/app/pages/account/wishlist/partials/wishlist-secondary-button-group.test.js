/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockedCustomerProductListsDetails} from '../../../../commerce-api/mock-data'
import CartItemVariant from '../../../../components/cart-item-variant'
import {renderWithProviders} from '../../../../utils/test-utils'
import WishlistSecondaryButtonGroup from './wishlist-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'

const MockedComponent = () => {
    const product = mockedCustomerProductListsDetails.data[0]
    return (
        <CartItemVariant variant={{...product, productName: product.name}}>
            <WishlistSecondaryButtonGroup />
        </CartItemVariant>
    )
}

jest.mock('../../../../commerce-api/hooks/useWishlist', () => {
    const originalModule = jest.requireActual(
        '../../../../commerce-api/hooks/useWishlist'
    )
    const useCustomerProductLists = originalModule.default
    return () => {
        const customerProductLists = useCustomerProductLists()

        return {
            ...customerProductLists,
            deleteCustomerProductListItem: jest.fn()
        }
    }
})

// Set up and clean up
beforeAll(() => {
    // Need to mock TextEncoder for tests
    if (typeof TextEncoder === 'undefined') {
        global.TextEncoder = require('util').TextEncoder
    }
})

beforeEach(() => {
    jest.resetModules()
})

afterEach(() => {
    jest.resetModules()
})

test('renders secondary action component', async () => {
    renderWithProviders(<MockedComponent />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()
    user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })

    user.click(confirmButton)

    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(screen.getByRole('alert')).toHaveTextContent(/Item removed from wishlist/i)
    })
})
