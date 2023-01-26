/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo} from 'react'
import {useCommerceAPI, CustomerProductListsContext} from '../contexts'
import {handleAsyncError} from '../utils'
import useCustomer from './useCustomer'

/**
 * This hook is designed to add customer product list capabilities
 * to your app, it leverages the Commerce API - Shopper Customer endpoints.
 * It uses a React context to store customer product list globally.
 *
 * By default, the Shopper Customer Product List API allows a shopper to
 * save multiple product lists. However, the PWA only use a single
 * product list, which is the wishlist. There is another hook useWishlist,
 * which is built on top of this hook to add wishlist specific logic.
 *
 * This Hook only works when your components are wrapped in CustomerProductListProvider.
 */
export default function useCustomerProductLists() {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const {state, actions} = useContext(CustomerProductListsContext)

    const getLists = handleAsyncError(() => {
        return api.shopperCustomers.getCustomerProductLists({
            parameters: {
                customerId: customer.customerId
            }
        })
    })

    const createList = handleAsyncError((name, type) => {
        return api.shopperCustomers.createCustomerProductList({
            body: {
                type,
                name
            },
            parameters: {
                customerId: customer.customerId
            }
        })
    })

    const getList = handleAsyncError((listId) => {
        return api.shopperCustomers.getCustomerProductList({
            parameters: {
                customerId: customer.customerId,
                listId
            }
        })
    })

    const createListItem = handleAsyncError((listId, item) => {
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
    })

    const updateListItem = handleAsyncError((listId, item) => {
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
    })

    const removeListItem = handleAsyncError((listId, itemId) => {
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
            getLists: async () => {
                const lists = await getLists()
                actions.receiveLists(lists)
                return lists
            },

            /**
             * Create a new product list.
             * @param {string} name
             * @param {string} type
             */
            createList: async (name, type) => {
                const list = await createList(name, type)
                actions.receiveList(list)
                return list
            },

            /**
             * Get a specific product list by id.
             * @param {string} listId
             * @param {object} options
             */
            getList: async (listId, options) => {
                const {detail} = options || {}
                let list = await getList(listId)

                if (detail) {
                    // automatically fetch details of the items in the list
                    list = await self.getProductDetails(list)
                }

                actions.receiveList(list)
                return list
            },

            /**
             * Get a product list for the registered user or
             * creates a new list if none exists, due to the api
             * limitation, we can not filter the lists based on
             * name/type, therefore it fetches all lists.
             * @param {string} name
             * @param {string} type
             * @param {object} options
             * @param {boolean} options.detail boolean flag to enable/disable fetching product details
             */
            getOrCreateList: async (name, type, options) => {
                const {detail} = options || {}
                let response = await getLists()

                // Note: if list is empty, the API response
                // does NOT contain the "data" key.
                let list = response.data?.find((list) => list.name === name)

                if (!list) {
                    list = await createList(name, type)
                }

                if (list && detail) {
                    list = await self.getProductDetails(list)
                }

                actions.receiveList(list)
                return list
            },

            /**
             * Adds an item to the customer's product list.
             * @param {string} listId
             * @param {Object} item item to be added to the list.
             */
            createListItem: async (listId, item) => {
                const createdItem = await createListItem(listId, item)
                actions.createListItem(listId, createdItem)
                return createdItem
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
                    await removeListItem(listId, id)
                    actions.removeListItem(listId, id)
                    return
                }
                const updatedItem = await updateListItem(listId, item)
                actions.updateListItem(listId, updatedItem)
                return updatedItem
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {string} itemId the id of the item in the product list
             */
            removeListItem: async (listId, itemId) => {
                await removeListItem(listId, itemId)
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
                return self.removeListItem(listId, item.id)
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
                        ids: ids.join(','),
                        allImages: true
                    }
                })

                // `getProducts` endpoint does not include `setProducts` data
                // so for each product set, we'll fetch it and append it to existing data
                const productSetFetches = productDetails.data
                    .filter((product) => product.type.set)
                    .map((product) => {
                        return api.shopperProducts
                            .getProduct({
                                parameters: {
                                    id: product.id
                                }
                            })
                            .then((data) => {
                                product.setProducts = data.setProducts
                            })
                    })
                await Promise.all(productSetFetches)

                const result = self.mergeProductDetailsIntoList(list, productDetails)

                // hasDetail is a flag to indicate
                // the list items are populated
                // with product detail data
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
                        ...item,
                        product
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
