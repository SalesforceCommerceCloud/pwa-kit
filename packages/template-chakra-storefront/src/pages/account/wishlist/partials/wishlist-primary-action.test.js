/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockWishListDetails} from './wishlist-primary-action.mock'
import ItemVariantProvider from '../../../../components/item-variant'
import {renderWithProviders} from '../../../../utils/test-utils'
import WishlistPrimaryAction from './wishlist-primary-action'
import {screen, waitFor, act} from '@testing-library/react'
import PropTypes from 'prop-types'
import {basketWithProductSet} from '../../../product-detail/index.mock'
import {mockProductBundle} from '../../../../../mocks/product-bundle'
import {prependHandlersToServer} from '../../../../../jest-setup'
import Toaster, {toaster} from '../../../../components/toaster'

const MockedComponent = ({variant}) => {
    return (
        <ItemVariantProvider variant={variant}>
            <WishlistPrimaryAction />
            <Toaster toaster={toaster} />
        </ItemVariantProvider>
    )
}
MockedComponent.propTypes = {
    variant: PropTypes.object
}

// Mock the useShopperBasketsMutationHelper hook
const mockAddItemToNewOrExistingBasket = jest.fn()

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useShopperBasketsMutationHelper: jest.fn(() => ({
        addItemToNewOrExistingBasket: mockAddItemToNewOrExistingBasket
    }))
}))

jest.mock('../../../../hooks/use-current-basket', () => {
    return {
        useCurrentBasket: () => {
            return {
                data: {basketId: 'basket_id'},
                derivedData: {totalItems: 5}
            }
        }
    }
})

beforeEach(() => {
    jest.resetModules()

    prependHandlersToServer([
        {
            path: '*/baskets/:basketId/items',
            method: 'post',
            res: () => basketWithProductSet
        }
    ])
})

afterEach(() => {
    jest.restoreAllMocks()
})

test('the Add To Cart button', async () => {
    // 701642884934M
    const variant = mockWishListDetails.data[3]

    const {user} = renderWithProviders(<MockedComponent variant={variant} />)

    const addToCartButton = await screen.findByRole('button', {
        name: new RegExp(`Add ${variant.name} to cart`, 'i')
    })

    mockAddItemToNewOrExistingBasket.mockResolvedValue({
        basketId: 'basket_id',
        productItems: [
            {
                productId: variant.id,
                productName: variant.name
            }
        ]
    })
    await act(async () => {
        await user.click(addToCartButton)
    })

    await waitFor(() => {
        expect(screen.getByText(/1 item added to cart/i)).toBeInTheDocument()
    })
})

test('the Add Set To Cart button', async () => {
    const productSetWithoutVariants = mockWishListDetails.data[1]
    const {user} = renderWithProviders(<MockedComponent variant={productSetWithoutVariants} />)
    const addSetToCartButton = await screen.findByRole('button', {
        name: new RegExp(`Add ${productSetWithoutVariants.name} set to cart`, 'i')
    })
    // set product children being added to cart
    mockAddItemToNewOrExistingBasket.mockResolvedValue({
        basketId: 'basket_id',
        productItems: [
            {
                productId: productSetWithoutVariants.setProducts[0].id,
                productName: productSetWithoutVariants.setProducts[0].name
            },
            {
                productId: productSetWithoutVariants.setProducts[0].id,
                productName: productSetWithoutVariants.setProducts[0].name
            }
        ]
    })
    await act(async () => {
        await user.click(addSetToCartButton)
    })

    await waitFor(() => {
        expect(screen.getByText(/2 items added to cart/i)).toBeInTheDocument()
    })
})

test('the View Full Details button', async () => {
    const productSetWithVariants = mockWishListDetails.data[0]
    renderWithProviders(<MockedComponent variant={productSetWithVariants} />)

    const link = await screen.findByRole('link', {name: /view full details/i})
    expect(link).toBeInTheDocument()
})

test('the View Options button', async () => {
    const masterProduct = mockWishListDetails.data[2]
    const {user} = renderWithProviders(<MockedComponent variant={masterProduct} />)

    const viewOptionsButton = await screen.findByRole('button', {name: /view options/i})
    await act(async () => {
        await user.click(viewOptionsButton)
    })

    await waitFor(
        () => {
            const modal = screen.getByTestId('product-view-modal')
            expect(modal).toBeVisible()
        },
        // Seems like rendering the modal takes a bit more time
        {timeout: 5000}
    )
})

test('bundle in wishlist renders the View Full Details button', async () => {
    renderWithProviders(<MockedComponent variant={mockProductBundle} />)

    const link = await screen.findByText(/view full details/i)
    expect(link).toBeInTheDocument()
})
