/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, cleanup} from '@testing-library/react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import PromoCallout from '@salesforce/retail-react-app/app/components/product-tile/promo-callout'
import {
    getProduct,
    productSearch
} from '@salesforce/retail-react-app/app/components/product-tile/promo-callout.mock.js'
import productSetWinterLookM from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'

describe('on product list page', () => {
    test('renders callout for a promotional price', () => {
        renderWithProviders(<PromoCallout product={productSearch.rollSleeveBlouse} />)
        const promoCallout = screen.getByTestId('promo-callout')
        expect(promoCallout).toHaveTextContent('10$ Off roll sleeve blouse')
    })

    test("renders the first promo's callout (when the price is not promotional price)", () => {
        renderWithProviders(<PromoCallout product={productSearch.sleevelessBlouse} />)
        const promoCallout = screen.getByTestId('promo-callout')
        expect(promoCallout).toHaveTextContent('Buy one Long Center Seam Skirt and get 2 tops')
    })

    test('renders callout for a non-variant product', () => {
        renderWithProviders(<PromoCallout product={productSearch.uprightCase} />)
        const promoCallout = screen.getByTestId('promo-callout')
        expect(promoCallout).toHaveTextContent('$20 off this luggage')
    })

    test('renders empty element, given a product without any promotions', () => {
        renderWithProviders(<PromoCallout product={productSearch.mensClassicDeerGloves} />)
        const promoCallout = screen.getByTestId('promo-callout')
        expect(promoCallout).toBeInTheDocument()
        expect(promoCallout).toHaveTextContent('')
    })

    test('renders empty element, given a product set with a promotion', () => {
        renderWithProviders(<PromoCallout product={productSearch.winterLook} />)
        const promoCallout = screen.getByTestId('promo-callout')

        // Expecting an empty element because applying a promo to the product set actually applies it to the children items.
        // i.e. product set is merely a grouping of some items, and it cannot really have a promotion.
        expect(promoCallout).toBeInTheDocument()
        expect(promoCallout).toHaveTextContent('')
    })
})

describe('on product detail page', () => {
    test("renders the first promo's callout (when the price is not promotional price)", () => {
        renderWithProviders(<PromoCallout product={getProduct.floralPonchoBlouse} />)
        const promoCallout = screen.getByTestId('promo-callout')
        expect(promoCallout).toHaveTextContent('Buy one Long Center Seam Skirt and get 2 tops')
    })

    test('API inconsistency: a product that should have a promotional price in its variants, but it does not', () => {
        renderWithProviders(<PromoCallout product={getProduct.rollSleeveBlouseMaster} />)
        const promoCallout = screen.getByTestId('promo-callout')
        expect(promoCallout).toHaveTextContent('Buy one Long Center Seam Skirt and get 2 tops') // unexpectedly render the first promo's callout
        // Once fixed, the API should return a promotional price, along with the callout "10$ Off roll sleeve blouse"
    })

    test('API inconsistency: product set having a promotion but does not include the promotional price', () => {
        renderWithProviders(<PromoCallout product={productSetWinterLookM} />)
        let promoCallout = screen.getByTestId('promo-callout')

        // Expecting an empty element because applying a promo to the product set actually applies it to the children items.
        // i.e. product set is merely a grouping of some items, and it cannot really have a promotion.
        expect(promoCallout).toBeInTheDocument()
        expect(promoCallout).toHaveTextContent('')

        cleanup()

        // However, we do expect the children item to show a promo callout.
        const childItem = productSetWinterLookM.setProducts[0]
        renderWithProviders(<PromoCallout product={childItem} />)
        promoCallout = screen.getByTestId('promo-callout')
        // In this case, the correct callout message is rendered, but actually the data does not include the promo price.
        expect(promoCallout).toHaveTextContent('$10 off product set')
    })
})
