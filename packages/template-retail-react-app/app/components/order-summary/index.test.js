/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const baseBasket = {
    basketId: 'test-basket-id',
    currency: 'USD',
    productSubTotal: 100,
    productTotal: 100,
    orderTotal: 100,
    shippingTotal: 0,
    taxTotal: 8,
    productItems: []
}

describe('OrderSummary promotions applied list', () => {
    test('renders coupons that are actually applied (statusCode applied/adhoc)', () => {
        const basket = {
            ...baseBasket,
            couponItems: [
                {couponItemId: '1', code: 'APPLIED10', statusCode: 'applied', valid: true},
                {couponItemId: '2', code: 'ADHOC5', statusCode: 'adhoc', valid: true}
            ]
        }
        renderWithProviders(<OrderSummary basket={basket} />)

        expect(screen.getByText('Promotions applied:')).toBeInTheDocument()
        expect(screen.getByText('APPLIED10')).toBeInTheDocument()
        expect(screen.getByText('ADHOC5')).toBeInTheDocument()
    })

    test('does not render a valid-but-ineligible coupon (no_applicable_promotion)', () => {
        const basket = {
            ...baseBasket,
            // SCAPI parks this on the basket with HTTP 200 and valid:true, but it
            // discounts nothing — it must not appear as an applied promotion.
            couponItems: [
                {
                    couponItemId: '1',
                    code: 'NOPE',
                    statusCode: 'no_applicable_promotion',
                    valid: true
                }
            ]
        }
        renderWithProviders(<OrderSummary basket={basket} />)

        expect(screen.queryByText('Promotions applied:')).not.toBeInTheDocument()
        expect(screen.queryByText('NOPE')).not.toBeInTheDocument()
    })

    test('renders only the applied coupons when the basket mixes applied and parked coupons', () => {
        const basket = {
            ...baseBasket,
            couponItems: [
                {couponItemId: '1', code: 'GOOD', statusCode: 'applied', valid: true},
                {
                    couponItemId: '2',
                    code: 'PARKED',
                    statusCode: 'no_applicable_promotion',
                    valid: true
                }
            ]
        }
        renderWithProviders(<OrderSummary basket={basket} />)

        expect(screen.getByText('Promotions applied:')).toBeInTheDocument()
        expect(screen.getByText('GOOD')).toBeInTheDocument()
        expect(screen.queryByText('PARKED')).not.toBeInTheDocument()
    })
})
