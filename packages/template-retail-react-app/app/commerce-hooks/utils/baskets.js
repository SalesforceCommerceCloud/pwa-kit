/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const getItemTotal = (baskets, basketId) => {
    const basket = baskets.find((basket) => basket.basketId === basketId)
    return basket?.productItems?.reduce((prev, next) => prev + next.quantity, 0) || 0
}
