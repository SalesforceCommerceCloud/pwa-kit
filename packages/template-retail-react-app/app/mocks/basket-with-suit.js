/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {mockCustomerBaskets} from './mock-data'
import mockVariant from './variant-750518699578M'

export const mockCustomerBasketsWithSuit = {
    ...mockCustomerBaskets.baskets[0],
    shippingTotalTax: 0.38,
    taxTotal: 9.14,
    taxation: 'gross',
    currency: 'USD',
    shipments: [
        {
            ...mockCustomerBaskets.baskets[0].shipments[0],
            shippingMethod: {
                description: 'Order received within 7-10 business days',
                id: 'GBP001',
                name: 'Ground',
                price: 7.99,
                shippingPromotions: [
                    {
                        calloutMsg: 'Free Shipping Amount Above 50',
                        promotionId: 'FreeShippingAmountAbove50',
                        promotionName: 'Free Shipping Amount Above 50'
                    }
                ],
                c_estimatedArrivalTime: '7-10 Business Days'
            }
        }
    ],
    productItems: [
        {
            adjustedTax: 9.14,
            basePrice: 191.99,
            bonusProductLineItem: false,
            gift: false,
            itemId: '54c599fdace475d97aeec72453',
            itemText: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
            price: 191.99,
            priceAfterItemDiscount: 191.99,
            priceAfterOrderDiscount: 191.99,
            productId: '750518699585M',
            productName: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
            quantity: 1,
            shipmentId: 'me',
            tax: 9.14,
            taxBasis: 191.99,
            taxClassId: 'standard',
            taxRate: 0.05
        }
    ]
}

export const mockSuitProduct = {
    ...mockVariant,
    id: '750518699585M'
}
