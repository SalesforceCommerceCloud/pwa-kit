/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as hooksUtils from '@salesforce/retail-react-app/app/utils/bonus-product/hooks'

describe('Bonus Product Hooks', () => {
    // Test hook functions exports (can't test actual React hooks in Jest environment)
    describe('React Hooks Exports', () => {
        test('hook utilities are exported and are functions', () => {
            expect(hooksUtils.useProductPromotionIds).toBeDefined()
            expect(typeof hooksUtils.useProductPromotionIds).toBe('function')

            expect(hooksUtils.useBasketProductsWithPromotions).toBeDefined()
            expect(typeof hooksUtils.useBasketProductsWithPromotions).toBe('function')

            expect(hooksUtils.useAvailableBonusItemsForProduct).toBeDefined()
            expect(typeof hooksUtils.useAvailableBonusItemsForProduct).toBe('function')

            expect(hooksUtils.useRemainingAvailableBonusProductsForProduct).toBeDefined()
            expect(typeof hooksUtils.useRemainingAvailableBonusProductsForProduct).toBe('function')
        })
    })
})
