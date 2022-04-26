/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockedCustomerProductListsDetails} from '../../../../commerce-api/mock-data'
import ItemVariantProvider from '../../../../components/item-variant'
import {renderWithProviders} from '../../../../utils/test-utils'
import WishlistPrimaryAction from './wishlist-primary-action'
import user from '@testing-library/user-event'
import {screen, waitFor} from '@testing-library/react'

const MockedComponent = (variant) => {
    return (
        <ItemVariantProvider variant={variant}>
            <WishlistPrimaryAction />
        </ItemVariantProvider>
    )
}

jest.mock('../../../../commerce-api/hooks/useBasket', () => {
    return () => {
        return {
            addItemToBasket: jest.fn()
        }
    }
})

beforeEach(() => {
    jest.resetModules()
})

test('renders primary action component', async () => {
    const {getByRole} = renderWithProviders(
        <MockedComponent variant={mockedCustomerProductListsDetails.data[0]} />
    )
    const addToCartButton = getByRole('button', {
        name: /add to cart/i
    })
    expect(addToCartButton).toBeInTheDocument()
    user.click(addToCartButton)

    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(screen.getByRole('alert')).toHaveTextContent(/items added to cart/i)
    })
})
