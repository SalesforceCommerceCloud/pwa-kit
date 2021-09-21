/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo} from 'react'
import {useCommerceAPI, CustomerProductListsContext} from '../contexts'
import {isError} from '../utils'

import useCustomer from './useCustomer'

/**
 * This hook is designed to add customer product list capabilities
 * to your app, it leverages the Commerce API - Shopper Customer endpoints.
 * It uses a React context to store customer product list globally.
 *
 * By default, the Shopper Customer Product List API allows a shopper to
 * save multiple product lists. However, the PWA only use a single
 * product list, which is the wishlist. There is another hook useCustomerProductList,
 * which is built on top of this hook to add wishlist specific logic.
 * You can think this hook as the "parent class" for the useCustomerProductList hook.
 *
 * If your application need to handle multiple customer product lists, this
 * is the hook for you, otherwise it is recommended to use useCustomerProductList hook.
 * 
 * This Hook only works when your components are wrapped in CustomerProductListProvider.
 */
export function useCustomerProductLists() {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const {state, actions} = useContext(CustomerProductListsContext)

    const self = useMemo(() => {
        return {
            isInitialized: state.isInitialized,
            data: state.productLists,

            reset() {
                actions.reset()
            },

            async getLists() {
                const response = await api.shopperCustomers.getCustomerProductLists({
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            },

            async createList(name, options) {
                const response = await api.shopperCustomers.createCustomerProductList({
                    body: {
                        ...options,
                        name
                    },
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            }
        }
    }, [customer.customerId, state])
    return self
}

/**
 * This hook is the "child class" of useCustomerProductLists.
 * It provides functionalities to manage a single wishlist for shoppers.
 */
export function useCustomerProductList(name, options = {}) {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const customerProductLists = useCustomerProductLists()
    const {actions} = useContext(CustomerProductListsContext)
    const DEFAULT_LIST_TYPE = 'wish_list'
    const type = options?.type || DEFAULT_LIST_TYPE

    const self = useMemo(() => {
        return {
            isInitialized: customerProductLists.isInitialized,
            reset: customerProductLists.reset,

            get data() {
                return Object.values(customerProductLists.data).find((list) => list.name === name)
            },

            get isEmpty() {
                return !self.data?.customerProductListItems?.length
            },

            findItemByProductId(productId) {
                return self.data?.customerProductListItems?.find(
                    (item) => item.productId === productId
                )
            },

            isProductInList(productId) {
                return !!self.findItemByProductId(productId)
            },

            /**
             * Initialize customer's product list.
             */
            async init() {
                actions.setInitialized(false)
                const list = await self._getOrCreatelistByName(name, {type})
                const productDetails = await self._getProductDetails(list)
                const result = self._mergeProductDetailsIntoList(list, productDetails)
                actions.receiveList(result)
                actions.setInitialized(true)
                return list
            },

            async getList(listId) {
                const response = await api.shopperCustomers.getCustomerProductList({
                    parameters: {
                        customerId: customer.customerId,
                        listId
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            },

            async addItem(product) {
                let list = self.data
                if (!self.isInitialized) {
                    list = await self.init()
                }
                const createdItem = await self.createListItem(list.id, product)
                actions.createListItem(list.id, createdItem)
            },

            async updateItem(item) {
                const {id, quantity} = item
                if (quantity === 0) {
                    await self.removeListItem(self.data.id, id)
                    actions.removeListItem(self.data.id, id)
                    return
                }
                const updatedItem = await self.updateListItem(self.data.id, item)
                actions.updateListItem(self.data.id, updatedItem)
            },

            async removeItem(itemId) {
                await self.removeListItem(self.data.id, itemId)
                actions.removeListItem(self.data.id, itemId)
            },

            async removeItemByProductId(productId) {
                const item = self.findItemByProductId(productId)
                if (!item) {
                    return
                }
                await self.removeItem(item.id)
            },

            /**
             * Adds an item to the customer's product list.
             * @param {object} listId
             * @param {Object} item item to be added to the list.
             */
            async createListItem(listId, item) {
                const {id, quantity} = item
                const response = await api.shopperCustomers.createCustomerProductListItem({
                    body: {
                        productId: id,
                        quantity,
                        public: false,
                        priority: 1,
                        type: 'product'
                    },
                    parameters: {
                        customerId: customer.customerId,
                        listId
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            },

            /**
             * Update an item in a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {object} item
             * @param {string} item.id the id of the item in the product list
             * @param {number} item.quantity the quantity of the item
             */
            async updateListItem(listId, item) {
                const {id, quantity} = item
                const response = await api.shopperCustomers.updateCustomerProductListItem({
                    body: {
                        id,
                        quantity,
                        public: false,
                        priority: 1
                    },
                    parameters: {
                        customerId: customer.customerId,
                        listId: listId,
                        itemId: item.id
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {string} itemId the id of the item in the product list
             */
            async removeListItem(listId, itemId) {
                const response = await api.shopperCustomers.deleteCustomerProductListItem(
                    {
                        parameters: {
                            itemId,
                            listId,
                            customerId: customer.customerId
                        }
                    },
                    true
                )

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            },

            /**
             * Fetches product lists for registered users or
             * creates a new list if none exists, due to the api
             * limitation, we can not get the list based on
             * name/type, therefore it fetches all lists
             * @returns product lists for registered users
             */
            async _getOrCreatelistByName(name, options) {
                let response = await customerProductLists.getLists()

                // Note: if list is empty, the API response doesn't
                // contain the "data" key.
                if (!response.data?.some((list) => list.name === name)) {
                    const {id} = await customerProductLists.createList(name, options)
                    response = await self.getList(id)
                    return response
                }

                return response.data.find((list) => list.name === name)
            },

            /**
             * Fetch list of product details from a product list.
             * The maximum number of productIDs that can be requested are 24.
             * @param {array} list product list
             * @returns {Object[]} list of product details for requested productIds
             */
            async _getProductDetails(list) {
                if (!list.customerProductListItems) {
                    return
                }

                const ids = list.customerProductListItems.map((item) => item.productId)
                const response = await api.shopperProducts.getProducts({
                    parameters: {
                        ids: ids.join(',')
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                return response
            },

            _mergeProductDetailsIntoList(list, productDetails) {
                list.customerProductListItems = list.customerProductListItems?.map((item) => {
                    const detail = {
                        ...productDetails.data.find((product) => product.id === item.productId)
                    }
                    return {
                        ...detail,
                        ...item,

                        // Both customer product list and the product detail API returns 'type'
                        // but the type can be different depending on the API endpoint
                        // We use the type from product detail endpoint, this is mainly used
                        // to determine whether the product is a master or a variant.
                        type: detail.type
                    }
                })
                return list
            }
        }
    }, [customerProductLists])

    return self
}
