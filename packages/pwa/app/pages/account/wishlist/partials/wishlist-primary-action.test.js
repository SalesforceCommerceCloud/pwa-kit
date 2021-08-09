/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {mockedCustomerProductListsDetails} from '../../../../commerce-api/mock-data'
import CartItemVariant from '../../../../components/cart-item-variant'
import {renderWithProviders} from '../../../../utils/test-utils'
import WishlistPrimaryAction from './wishlist-primary-action'
import user from '@testing-library/user-event'
import {screen, waitFor} from '@testing-library/react'

let mockedProductItem = {}

const MockedComponent = () => {
    return (
        <CartItemVariant variant={mockedProductItem}>
            <WishlistPrimaryAction />
        </CartItemVariant>
    )
}

jest.mock('../../../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('../../../../commerce-api/hooks/useBasket', () => {
    const originalModule = jest.requireActual('../../../../commerce-api/hooks/useBasket')
    const useBasket = originalModule.default
    return () => {
        const basket = useBasket()

        return {
            ...basket,
            addItemToBasket: jest.fn()
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

test('renders primary action component', async () => {
    mockedProductItem = mockedCustomerProductListsDetails.data[0]
    const {getByRole} = renderWithProviders(<MockedComponent />)
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
