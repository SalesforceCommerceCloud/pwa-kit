/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import useCustomerProductLists from './useCustomerProductLists'

/**
 * This hook is built on top of the useCustomerProductLists hook,
 * to provide functionalities to manage a single list.
 * A typical use case is wish list.
 */
const useCustomerProductList = (name, type) => {
    // cpl is the shorthand for "Cutomer Product Lists"
    const cpl = useCustomerProductLists()
    const self = useMemo(() => {
        return {
            ...cpl,

            get data() {
                return cpl.findListByName(name)
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

            // boolean value indicate the list
            // is populated with product details
            get hasDetail() {
                return !!self.data?.hasDetail
            },

            /**
             * Initialize the list.
             */
            init(options) {
                return cpl.getOrCreateList(name, type, options)
            },

            /**
             * Adds an item to the customer's list.
             * @param {Object} item item to be added to the list.
             * @param {string} item.id
             * @param {number} item.quantity
             */
            createListItem: async (item) => {
                if (!self.isInitialized) {
                    const list = await self.init()
                    return cpl.createListItem(list.id, item)
                }
                return cpl.createListItem(self.data.id, item)
            },

            /**
             * Update an item to the customer's list.
             * @param {Object} item item to be updated
             * @param {string} item.id
             * @param {number} item.quantity
             */
            updateListItem: (item) => {
                return cpl.updateListItem(self.data.id, item)
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} itemId the id of the item in the product list
             */
            removeListItem: (itemId) => {
                return cpl.removeListItem(self.data.id, itemId)
            },

            /**
             * Remove an item from the customer's list.
             *
             * @param {string} productId the id of the product
             */
            removeListItemByProductId: (productId) => {
                return cpl.removeListItemByProductId(self.data.id, productId)
            },

            /**
             * Find the item from list.
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

export default useCustomerProductList
