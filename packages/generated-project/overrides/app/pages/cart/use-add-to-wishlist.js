/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useAddToWishlist as _useAddToWishlist} from '@salesforce/retail-react-app/app/pages/cart/use-add-to-wishlist'

export const useAddToWishlist = () => {
    const addToWishlist = _useAddToWishlist()

    return async (product) => {
        await addToWishlist(product)
        console.log('--- Pretend we are sending analytics to track this adding to wishlist')
    }
}
