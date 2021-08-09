import React from 'react'
import {
    mockedCustomerProductLists,
    mockedCustomerProductListsDetails
} from '../../../commerce-api/mock-data'
import CartItemVariant from '../../../components/cart-item-variant'
import {renderWithProviders} from '../../../utils/test-utils'
import CartSecondaryButtonGroup from './cart-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'

const MockedComponent = () => {
    const product = mockedCustomerProductListsDetails.data[0]
    return (
        <CartItemVariant variant={{...product, productName: product.name}}>
            <CartSecondaryButtonGroup />
        </CartItemVariant>
    )
}

jest.mock('../../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('../../../commerce-api/hooks/useBasket', () => {
    const originalModule = jest.requireActual('../../../commerce-api/hooks/useBasket')
    const useBasket = originalModule.default
    return () => {
        const basket = useBasket()

        return {
            ...basket,
            removeItemFromBasket: jest.fn()
        }
    }
})

jest.mock('../../../commerce-api/hooks/useCustomerProductLists', () => {
    const originalModule = jest.requireActual('../../../commerce-api/hooks/useCustomerProductLists')
    const useCustomerProductLists = originalModule.default
    return () => {
        const customerProductLists = useCustomerProductLists()

        return {
            ...customerProductLists,
            ...mockedCustomerProductLists,
            loaded: jest.fn().mockReturnValue(true),
            createCustomerProductListItem: jest.fn().mockReturnValue({id: 'testid'})
        }
    }
})

jest.mock('../../../commerce-api/hooks/useCustomer', () => {
    const originalModule = jest.requireActual('../../../commerce-api/hooks/useCustomer')
    const useCustomer = originalModule.default
    return () => {
        const customer = useCustomer()

        return {
            ...customer,
            authType: 'registered'
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
        expect(screen.getByRole('alert')).toHaveTextContent(/item removed from cart/i)
    })

    const addToWishlistButton = screen.getByRole('button', {
        name: /add to wishlist/i
    })

    user.click(addToWishlistButton)

    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(screen.getAllByText(/1 item added to wishlist/i)).not.toHaveLength(0)
    })
})
