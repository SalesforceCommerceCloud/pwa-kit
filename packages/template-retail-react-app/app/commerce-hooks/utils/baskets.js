/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const getItemTotal = (baskets, basketId) => {
    console.log('baskets', baskets)
    console.log('basketId', basketId)
    const basket = baskets.find(
        (basket) => console.log('basket.basketId', basket.basketId) || basket.basketId === basketId
    )
    console.log('basket.productItems', basket)
    return basket?.productItems?.reduce((prev, next) => prev + next.quantity, 0) || 0
}
