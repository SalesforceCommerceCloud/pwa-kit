/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import PromoCallout from '@salesforce/retail-react-app/app/components/product-tile/promo-callout'
import {productSearch} from '@salesforce/retail-react-app/app/components/product-tile/promo-callout.mock.js'

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
