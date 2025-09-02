/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import BonusProductViewModal from './index'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'

// Mock the navigation hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => 
    jest.fn(() => jest.fn())
)

// Mock ProductView to test maxOrderQuantity prop functionality
jest.mock('@salesforce/retail-react-app/app/components/product-view', () => {
    return function MockProductView({maxOrderQuantity}) {
        return <div data-testid="max-order-quantity">{maxOrderQuantity ?? 'null'}</div>
    }
})

// Mock bonus product utils
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product-utils', () => ({
    getRemainingAvailableBonusProductsForProduct: jest.fn(),
    findAvailableBonusDiscountLineItemId: jest.fn()
}))

// Mock current basket hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

beforeEach(() => {
    prependHandlersToServer([
        {
            path: '*/products/:productId',
            res: () => mockProductDetail
        }
    ])
})

describe('BonusProductViewModal - getRemainingBonusQuantity', () => {
    test('calculates remaining bonus quantity correctly (5 - 2 = 3)', () => {
        const {getRemainingAvailableBonusProductsForProduct} = require('@salesforce/retail-react-app/app/utils/bonus-product-utils')
        
        // Mock calculation: 5 available - 2 selected = 3 remaining
        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 5,
            aggregatedSelectedItems: 2
        })

        // Mock basket to exist (required for getMaxOrderQuantity to work)
        const mockBasket = {bonusDiscountLineItems: []}
        const {useCurrentBasket} = require('@salesforce/retail-react-app/app/hooks/use-current-basket')
        useCurrentBasket.mockReturnValue({data: mockBasket})

        renderWithProviders(
            <BonusProductViewModal 
                product={mockProductDetail} 
                isOpen={true} 
                onClose={() => {}}
                bonusDiscountLineItemId="test-id"
                promotionId="test-promo"
            />
        )

        // Should pass 5 - 2 = 3 to ProductView as maxOrderQuantity
        expect(screen.getByTestId('max-order-quantity')).toHaveTextContent('3')
    })
})