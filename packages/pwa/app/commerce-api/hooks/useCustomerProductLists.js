/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo} from 'react'
import {useCommerceAPI, CustomerProductListsContext} from '../contexts'
import {isError, handleAsyncError} from '../utils'
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
            data: state.productLists,

            get isInitialized() {
                return state.productLists !== undefined
            },

            reset() {
                actions.reset()
            },

            /**
             * Get customer's product lists.
             */
            getLists: handleAsyncError(() => {
                return api.shopperCustomers.getCustomerProductLists({
                    parameters: {
                        customerId: customer.customerId
                    }
                })
            }),

            /**
             * Create a new product list.
             * @param {string} name
             * @param {options} object
             */
            createList: handleAsyncError((name, options) => {
                return api.shopperCustomers.createCustomerProductList({
                    body: {
                        ...options,
                        name
                    },
                    parameters: {
                        customerId: customer.customerId
                    }
                })
            }),

            /**
             * Get a specific product list by id.
             * @param {string} listId
             */
            getList: handleAsyncError((listId) => {
                return api.shopperCustomers.getCustomerProductList({
                    parameters: {
                        customerId: customer.customerId,
                        listId
                    }
                })
            }),

            /**
             * Adds an item to the customer's product list.
             * @param {string} listId
             * @param {Object} item item to be added to the list.
             */
            createListItem: handleAsyncError((listId, item) => {
                const {id, quantity} = item
                return api.shopperCustomers.createCustomerProductListItem({
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
            }),

            /**
             * Update an item in a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {object} item
             * @param {string} item.id the id of the item in the product list
             * @param {number} item.quantity the quantity of the item
             */
            updateListItem: handleAsyncError((listId, item) => {
                const {id, quantity} = item
                return api.shopperCustomers.updateCustomerProductListItem({
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
            }),

            /**
             * Remove an item from a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {string} itemId the id of the item in the product list
             */
            removeListItem: handleAsyncError((listId, itemId) => {
                return api.shopperCustomers.deleteCustomerProductListItem(
                    {
                        parameters: {
                            itemId,
                            listId,
                            customerId: customer.customerId
                        }
                    },
                    true
                )
            })
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
    const customerProductLists = useCustomerProductLists()
    const {actions} = useContext(CustomerProductListsContext)
    const DEFAULT_LIST_TYPE = 'wish_list'
    const type = options?.type || DEFAULT_LIST_TYPE

    const self = useMemo(() => {
        return {
            get data() {
                if (!customerProductLists.isInitialized) {
                    return undefined
                }
                return Object.values(customerProductLists.data).find((list) => list.name === name)
            },

            get isInitialized() {
                return !!self.data?.isInitialized
            },

            get isEmpty() {
                return !self.data?.customerProductListItems?.length
            },

            reset() {
                actions.receiveList({id: self.data.id})
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
                const list = await self._getOrCreatelistByName(name, {type})
                const productDetails = await self._getProductDetails(list)
                const result = self._mergeProductDetailsIntoList(list, productDetails)
                result.isInitialized = true
                actions.receiveList(result)
                return list
            },

            async addItem(product) {
                let list = self.data
                if (!self.isInitialized) {
                    list = await self.init()
                }
                const createdItem = await customerProductLists.createListItem(list.id, product)
                actions.createListItem(list.id, createdItem)
            },

            async updateItem(item) {
                const {id, quantity} = item
                if (quantity === 0) {
                    await customerProductLists.removeListItem(self.data.id, id)
                    actions.removeListItem(self.data.id, id)
                    return
                }
                const updatedItem = await customerProductLists.updateListItem(self.data.id, item)
                actions.updateListItem(self.data.id, updatedItem)
            },

            async removeItem(itemId) {
                await customerProductLists.removeListItem(self.data.id, itemId)
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
                    response = await customerProductLists.getList(id)
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
                    const product = {
                        ...productDetails.data.find((product) => product.id === item.productId)
                    }
                    return {
                        ...product,
                        ...item,

                        // Both customer product list and the product detail API returns 'type'
                        // but the type can be different depending on the API endpoint
                        // We use the type from product detail endpoint, this is mainly used
                        // to determine whether the product is a master or a variant.
                        type: product.type
                    }
                })
                return list
            }
        }
    }, [customerProductLists])

    return self
}
