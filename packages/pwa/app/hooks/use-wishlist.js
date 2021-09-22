/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import useCustomerProductLists from '../commerce-api/hooks/useCustomerProductLists'


const useWishlist = () => {
    const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'
    const PWA_DEFAULT_WISHLIST_TYPE = 'wish_list'

    // cpl is the shorthand for "Cutomer Product List"
    const cpl = useCustomerProductLists()

    return {
        ...cpl,

        get data() {
            return cpl.findListByName(PWA_DEFAULT_WISHLIST_NAME)
        },

        /**
         * Initialize the wishlist.
         */
         async init() {
            const wishlist = await cpl.getOrCreateList(PWA_DEFAULT_WISHLIST_NAME, PWA_DEFAULT_WISHLIST_TYPE)
            const productDetails = await cpl.getProductDetails(wishlist)
            const result = cpl.mergeProductDetailsIntoList(wishlist, productDetails)
            result.isInitialized = true
            cpl.actions.receiveList(result)
        },
    }
}

export default useWishlist
