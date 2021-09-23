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
export default function useCustomerProductLists() {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const {state, actions} = useContext(CustomerProductListsContext)

    const self = useMemo(() => {
        return {
            actions,

            data: state.productLists,

            get isInitialized() {
                return state.productLists !== undefined
            },

            reset() {
                actions.reset()
            },

            // methods that purely send network requests
            // these methods does not alter states stored
            // in the context
            requests: {
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
                 * @param {string} type
                 */
                createList: handleAsyncError((name, type) => {
                    return api.shopperCustomers.createCustomerProductList({
                        body: {
                            type,
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
                 * @param {object} options
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
            },

            /**
             * Get customer's product lists.
             */
            getLists: async () => {
                const lists = await self.requests.getLists()
                actions.receiveLists(lists)
            },

            /**
             * Create a new product list.
             * @param {string} name
             * @param {string} type
             */
            createList: async (name, type) => {
                const list = await self.requests.createList(name, type)
                actions.receiveList(list)
            },

            /**
             * Get a specific product list by id.
             * @param {string} listId
             * @param {object} options
             */
            getList: async (listId, options) => {
                const {detail} = options || {}
                let list = await self.requests.getList(listId)

                if (detail) {
                    // automatically fetch details of the items in the list
                    list = await self.getProductDetails(list)
                }

                actions.receiveList(list)
            },

            /**
             * Get a product list for the registered user or
             * creates a new list if none exists, due to the api
             * limitation, we can not filter the lists based on
             * name/type, therefore it fetches all lists.
             * @param {string} name
             * @param {string} type
             */
            getOrCreateList: async (name, type, options) => {
                const {detail} = options || {}
                let response = await self.requests.getLists()

                // Note: if list is empty, the API response
                // does NOT contain the "data" key.
                let list = response.data?.find((list) => list.name === name)
                if (list) {
                    if (detail) {
                        // automatically fetch details of the items in the list
                        list = await self.getProductDetails(list)
                    }

                    // automatically fetch details of the items in the list
                    list = await self.getProductDetails(list)
                } else {
                    list = await self.requests.createList(name, type)
                }

                actions.receiveList(list)
            },

            /**
             * Adds an item to the customer's product list.
             * @param {string} listId
             * @param {Object} item item to be added to the list.
             */
            createListItem: async (listId, item) => {
                const createdItem = await self.requests.createListItem(listId, item)
                actions.createListItem(listId, createdItem)
            },

            /**
             * Update an item in a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {object} item
             * @param {string} item.id the id of the item in the product list
             * @param {number} item.quantity the quantity of the item
             */
            updateListItem: async (listId, item) => {
                const {id, quantity} = item
                if (quantity === 0) {
                    await self.requests.removeListItem(listId, id)
                    actions.removeListItem(listId, id)
                    return
                }
                const updatedItem = await self.requests.updateListItem(listId, item)
                actions.updateListItem(listId, updatedItem)
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {string} itemId the id of the item in the product list
             */
            removeListItem: async (listId, itemId) => {
                await self.requests.removeListItem(listId, itemId)
                actions.removeListItem(listId, itemId)
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {string} productId the id of the product
             */
            removeListItemByProductId(listId, productId) {
                const item = self.findItemByProductId(listId, productId)
                if (!item) {
                    console.warn(
                        `Cannot remove item because product ${productId} is not in the list.`
                    )
                    return
                }
                self.removeListItem(listId, item.id)
            },

            /**
             * Get all item details for a product list.
             * @param {object} list product list
             * @param {array} list.customerProductListItems items array
             * @returns {Object} customer product list
             */
            getProductDetails: handleAsyncError(async (list) => {
                // Warning, there is a weird API behavior
                // where if the product list is newly created
                // the "customerProductListItems" key will be missing
                // from the response, so we need to guard it.
                if (!list.customerProductListItems) {
                    return {...list, hasDetail: true}
                }

                const ids = list.customerProductListItems.map((item) => item.productId)
                const productDetails = await api.shopperProducts.getProducts({
                    parameters: {
                        ids: ids.join(',')
                    }
                })
                const result = self.mergeProductDetailsIntoList(list, productDetails)
                result.hasDetail = true
                return {...result, hasDetail: true}
            }),

            /**
             * The customer product list API does NOT return the
             * product item details, this utility function is used
             * when you fetch the item details manually and insert
             * into the lists.
             * This function is often used with getProductDetails.
             */
            mergeProductDetailsIntoList(list, productDetails) {
                const items = list.customerProductListItems?.map((item) => {
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
                return {
                    ...list,
                    customerProductListItems: items
                }
            },

            /**
             * Find the product list by its name.
             * @param {string} name
             * @returns {object} customer product list
             */
            findListByName(name) {
                if (!self.data) {
                    return undefined
                }
                return Object.values(self.data).find((list) => list.name === name)
            },

            /**
             * Find the product list by its id.
             * @param {string} id
             * @returns {object} customer product list
             */
            findListById(id) {
                if (!self.data) {
                    return undefined
                }
                return Object.values(self.data).find((list) => list.id === id)
            },

            /**
             * Find the item from list.
             * @param {string} listId
             * @param {string} productId
             * @returns {object} product list item
             */
            findItemByProductId(listId, productId) {
                return self
                    .findListById(listId)
                    ?.customerProductListItems?.find((item) => item.productId === productId)
            }
        }
    }, [customer.customerId, state])
    return self
}

// /**
//  * This hook is the "child class" of useCustomerProductLists.
//  * It provides functionalities to manage a single wishlist for shoppers.
//  */
// export function useCustomerProductList(name, options = {}) {
//     const api = useCommerceAPI()
//     const customerProductLists = useCustomerProductLists()
//     const {actions} = useContext(CustomerProductListsContext)
//     const DEFAULT_LIST_TYPE = 'wish_list'
//     const type = options?.type || DEFAULT_LIST_TYPE

//     const self = useMemo(() => {
//         return {
//             get data() {
//                 if (!customerProductLists.isInitialized) {
//                     return undefined
//                 }
//                 return Object.values(customerProductLists.data).find((list) => list.name === name)
//             },

//             get isInitialized() {
//                 return !!self.data?.isInitialized
//             },

//             get isEmpty() {
//                 return !self.data?.customerProductListItems?.length
//             },

//             reset() {
//                 actions.receiveList({id: self.data.id})
//             },

//             findItemByProductId(productId) {
//                 return self.data?.customerProductListItems?.find(
//                     (item) => item.productId === productId
//                 )
//             },

//             isProductInList(productId) {
//                 return !!self.findItemByProductId(productId)
//             },

//             /**
//              * Initialize customer's product list.
//              */
//             async init() {
//                 const list = await self._getOrCreatelistByName(name, {type})
//                 const productDetails = await self._getProductDetails(list)
//                 const result = self._mergeProductDetailsIntoList(list, productDetails)
//                 result.isInitialized = true
//                 actions.receiveList(result)
//                 return list
//             },

//             async addItem(product) {
//                 let list = self.data
//                 if (!self.isInitialized) {
//                     list = await self.init()
//                 }
//                 const createdItem = await customerProductLists.createListItem(list.id, product)
//                 actions.createListItem(list.id, createdItem)
//             },

//             async updateItem(item) {
//                 const {id, quantity} = item
//                 if (quantity === 0) {
//                     await customerProductLists.removeListItem(self.data.id, id)
//                     actions.removeListItem(self.data.id, id)
//                     return
//                 }
//                 const updatedItem = await customerProductLists.updateListItem(self.data.id, item)
//                 actions.updateListItem(self.data.id, updatedItem)
//             },

//             async removeItem(itemId) {
//                 await customerProductLists.removeListItem(self.data.id, itemId)
//                 actions.removeListItem(self.data.id, itemId)
//             },

//             async removeItemByProductId(productId) {
//                 const item = self.findItemByProductId(productId)
//                 if (!item) {
//                     return
//                 }
//                 await self.removeItem(item.id)
//             },

//             /**
//              * Fetches product lists for registered users or
//              * creates a new list if none exists, due to the api
//              * limitation, we can not get the list based on
//              * name/type, therefore it fetches all lists
//              * @returns product lists for registered users
//              */
//             async _getOrCreatelistByName(name, options) {
//                 let response = await customerProductLists.getLists()

//                 // Note: if list is empty, the API response doesn't
//                 // contain the "data" key.
//                 if (!response.data?.some((list) => list.name === name)) {
//                     const {id} = await customerProductLists.createList(name, options)
//                     response = await customerProductLists.getList(id)
//                     return response
//                 }

//                 return response.data.find((list) => list.name === name)
//             },

//             /**
//              * Fetch list of product details from a product list.
//              * The maximum number of productIDs that can be requested are 24.
//              * @param {object} list product list
//              * @returns {Object[]} list of product details for requested productIds
//              */
//             async _getProductDetails(list) {
//                 if (!list.customerProductListItems) {
//                     return
//                 }

//                 const ids = list.customerProductListItems.map((item) => item.productId)
//                 const response = await api.shopperProducts.getProducts({
//                     parameters: {
//                         ids: ids.join(',')
//                     }
//                 })

//                 if (isError(response)) {
//                     throw new Error(response)
//                 }

//                 return response
//             },

//             _mergeProductDetailsIntoList(list, productDetails) {
//                 list.customerProductListItems = list.customerProductListItems?.map((item) => {
//                     const product = {
//                         ...productDetails.data.find((product) => product.id === item.productId)
//                     }
//                     return {
//                         ...product,
//                         ...item,

//                         // Both customer product list and the product detail API returns 'type'
//                         // but the type can be different depending on the API endpoint
//                         // We use the type from product detail endpoint, this is mainly used
//                         // to determine whether the product is a master or a variant.
//                         type: product.type
//                     }
//                 })
//                 return list
//             }
//         }
//     }, [customerProductLists])

//     return self
// }
