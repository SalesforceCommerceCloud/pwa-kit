/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import user from '@testing-library/user-event'
import ProductScroller from './index'
import {renderWithProviders} from '../../utils/test-utils'

// Our component uses `scrollBy` on an html element, which we need
// to create ourselves as its not in jsdom by default. Here we make
// it a spy so we can assert it was called when we expect.
window.HTMLElement.prototype.scrollBy = jest.fn()

const testProducts = [1, 2, 3, 4].map((i) => ({
    id: i,
    productId: `${i}`,
    productName: `Product ${i}`,
    image: {disBaseLink: '/testimage'},
    price: 9.99,
    currency: 'USD'
}))

describe('Product Scroller', () => {
    test('renders loading skeletons', () => {
        renderWithProviders(<ProductScroller isLoading />)
        expect(screen.getAllByTestId('product-scroller-item-skeleton')).toHaveLength(4)
    })
    test('renders nothing when no products and not loading', () => {
        renderWithProviders(<ProductScroller products={undefined} />)
        expect(screen.queryByTestId('product-scroller')).not.toBeInTheDocument()
    })
    test('Renders product items', () => {
        renderWithProviders(<ProductScroller title="Scroller Title" products={testProducts} />)
        expect(screen.getByText('Scroller Title')).toBeInTheDocument()
        expect(screen.getAllByTestId('product-scroller-item')).toHaveLength(4)
    })
    test('Renders scrollable product tiles with custom header component', () => {
        renderWithProviders(
            <ProductScroller
                header={<h1 data-testid="custom-header">Scroller Header</h1>}
                products={testProducts}
            />
        )
        expect(screen.getByTestId('custom-header')).toBeInTheDocument()
    })
    test('Renders left/right scroll buttons', () => {
        renderWithProviders(<ProductScroller title="Scroller Title" products={testProducts} />)
        user.click(screen.getByTestId('product-scroller-nav-right'))
        expect(window.HTMLElement.prototype.scrollBy).toHaveBeenCalledWith({
            top: 0,
            left: 1024,
            behavior: 'smooth'
        })
        user.click(screen.getByTestId('product-scroller-nav-left'))
        expect(window.HTMLElement.prototype.scrollBy).toHaveBeenCalledWith({
            top: 0,
            left: -1024,
            behavior: 'smooth'
        })
        expect(screen.getByTestId('product-scroller-nav-left')).toBeInTheDocument()
        expect(screen.getByTestId('product-scroller-nav-right')).toBeInTheDocument()
    })
    test('Does not render left/right scroll buttons when less than 4 products', () => {
        renderWithProviders(
            <ProductScroller title="Scroller Title" products={testProducts.slice(0, 2)} />
        )
        expect(screen.queryByTestId('product-scroller-nav-left')).not.toBeInTheDocument()
        expect(screen.queryByTestId('product-scroller-nav-right')).not.toBeInTheDocument()
    })
    test('productTileProps as object', () => {
        const onClickMock = jest.fn()
        renderWithProviders(
            <ProductScroller products={testProducts} productTileProps={{onClick: onClickMock}} />
        )
        user.click(screen.getByText(testProducts[0].productName))
        expect(onClickMock).toHaveBeenCalled()
    })
    test('productTileProps as function', () => {
        const onClickMock = jest.fn()
        renderWithProviders(
            <ProductScroller
                products={testProducts}
                productTileProps={() => ({onClick: onClickMock})}
            />
        )
        user.click(screen.getByText(testProducts[0].productName))
        expect(onClickMock).toHaveBeenCalled()
    })
})
