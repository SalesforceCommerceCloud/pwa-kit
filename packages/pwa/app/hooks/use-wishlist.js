/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import useCustomerProductLists from '../commerce-api/hooks/useCustomerProductLists'

const useWishlist = () => {
    const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'
    const PWA_DEFAULT_WISHLIST_TYPE = 'wish_list'

    // cpl is the shorthand for "Cutomer Product List"
    const cpl = useCustomerProductLists()
    const self = useMemo(() => {
        return {
            ...cpl,

            get data() {
                return cpl.findListByName(PWA_DEFAULT_WISHLIST_NAME)
            },

            get items() {
                return self.data?.customerProductListItems || []
            },

            get isEmpty() {
                return !self.items?.length
            },

            get isInitialized() {
                return !!self.data?.isInitialized
            },

            /**
             * Initialize the wishlist.
             */
            async init() {
                const wishlist = await cpl.getOrCreateList(
                    PWA_DEFAULT_WISHLIST_NAME,
                    PWA_DEFAULT_WISHLIST_TYPE
                )
                const productDetails = await cpl.getProductDetails(wishlist)
                const result = cpl.mergeProductDetailsIntoList(wishlist, productDetails)
                result.isInitialized = true
                cpl.actions.receiveList(result)
            },

            /**
             * Find the item from wishlist.
             * @param {string} productId
             * @returns {object} product list item
             */
            findItem(productId) {
                return self.items.find((item) => item.productId === productId)
            }
        }
    }, [cpl])
    return self
}

export default useWishlist
