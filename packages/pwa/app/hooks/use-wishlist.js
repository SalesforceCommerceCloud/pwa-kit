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

    // cpl is the shorthand for "Cutomer Product Lists"
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
                return !!self.data?.id
            },

            // boolean value indicate the wishlist
            // is populated with product details
            get hasDetail() {
                return !!self.data?.hasDetail
            },

            /**
             * Initialize the wishlist.
             */
            init(options) {
                cpl.getOrCreateList(PWA_DEFAULT_WISHLIST_NAME, PWA_DEFAULT_WISHLIST_TYPE, options)
            },

            /**
             * Adds an item to the customer's wishlist.
             * @param {Object} item item to be added to the list.
             * @param {string} item.id
             * @param {number} item.quantity
             */
            createListItem: (item) => {
                cpl.createListItem(self.data.id, item)
            },

            /**
             * Update an item to the customer's wishlist.
             * @param {Object} item item to be updated
             * @param {string} item.id
             * @param {number} item.quantity
             */
            updateListItem: (item) => {
                cpl.updateListItem(self.data.id, item)
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} itemId the id of the item in the product list
             */
            removeListItem: (itemId) => {
                cpl.removeListItem(self.data.id, itemId)
            },

            /**
             * Remove an item from the customer's wishlist.
             *
             * @param {string} productId the id of the product
             */
            removeListItemByProductId: (productId) => {
                cpl.removeListItemByProductId(self.data.id, productId)
            },

            /**
             * Find the item from wishlist.
             * @param {string} productId
             * @returns {object} product list item
             */
            findItemByProductId(productId) {
                if (!self.isInitialized) {
                    return undefined
                }
                return cpl.findItemByProductId(self.data.id, productId)
            }
        }
    }, [cpl])
    return self
}

export default useWishlist
