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
import Queue from '../../utils/queue'

// A event queue for the following use cases:
// 1. Allow user to add item to wishlist before wishlist is initialized
// 2. Allow user to add item to wishlist before logging in
// e.g. user clicks add to wishlist, push event to the queue, show login
// modal, pop the event after successfully logged in
export class CustomerProductListEventQueue extends Queue {
    static eventTypes = {
        ADD: 'add',
        REMOVE: 'remove'
    }
}

const eventQueue = new CustomerProductListEventQueue()

/**
 * This hook is designed to add customer product list capabilities
 * to your app, it leverages the Commerce API - Shopper Customer endpoints.
 * It uses a React context to store customer product list globally.
 *
 * By default, the Shopper Customer Product List API allows a shopper to
 * save multiple product lists. However, the PWA only use a single
 * product list, which is the wishlist. There is another hook useWishlist,
 * which is built on top of this hook to add wishlist specific logic.
 * You can think this hook as the "parent class" for the useWishlist hook.
 *
 * If your application need to handle multiple customer product lists, this
 * is the hook for you, otherwise it is recommended to use useWishlist hook.
 */
export function useCustomerProductLists() {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const {state, actions} = useContext(CustomerProductListsContext)

    // useEffect(() => {
    //     eventQueue.process(async (event) => {
    //         const {action, item, list, listType} = event
    //         switch (action) {
    //             case CustomerProductListEventQueue.eventTypes.ADD: {
    //                 try {
    //                     const productList = self.getProductListPerType(listType)
    //                     const productListItem = productList.customerProductListItems.find(
    //                         ({productId}) => productId === event.item.id
    //                     )
    //                     // if the item is already in the wishlist
    //                     // only update the quantity
    //                     if (productListItem) {
    //                         await self._updateListItem(productList, {
    //                             ...productListItem,
    //                             quantity: event.item.quantity + productListItem.quantity
    //                         })
    //                         eventHandler(event)
    //                     } else {
    //                         await self.createCustomerProductListItem(productList, {
    //                             productId: event.item.id,
    //                             priority: 1,
    //                             quantity: parseInt(event.item.quantity),
    //                             public: false,
    //                             type: 'product'
    //                         })
    //                         eventHandler(event)
    //                     }
    //                 } catch (error) {
    //                     errorHandler(error)
    //                 }
    //                 break
    //             }

    //             case CustomerProductListEventQueue.eventTypes.REMOVE:
    //                 try {
    //                     await self.deleteCustomerProductListItem(list, item)
    //                     eventHandler(event)
    //                 } catch (error) {
    //                     errorHandler(error)
    //                 }
    //                 break
    //         }
    //     })
    // }, [customerProductLists])

    const self = useMemo(() => {
        return {
            ...state,

            reset() {
                actions.reset()
            },

            async _getLists() {
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

            async _createList(name, type) {
                const response = await api.shopperCustomers.createCustomerProductList({
                    body: {
                        type,
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
            },

            /**
             * Fetch list of product details from a product list.
             * The maximum number of productIDs that can be requested are 24.
             * @param {array} list product list
             * @returns {Object[]} list of product details for requested productIds
             */
            async _getProductsInList(list) {
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

            // /**
            //  * @TODO: remove this function as it exposes unnecessary knowledge
            //  * to outside systems. The queue logic should be encapsulated in this
            //  * hook only. The API for outside consuming should be something like:
            //  * addItemToList, removeItemToList...
            //  * Event queue holds user actions that need to execute on product-lists
            //  * while the product list information has not yet loaded (eg: Adding to wishlist immedeately after login).
            //  * @param {object} event Event to be added to queue. event object has properties: action: {item: Object, list?: object, action: eventActions, listType: CustomerProductListType}
            //  */
            // addActionToEventQueue(event) {
            //     eventQueue.enqueue(event)
            // },

            /**
             * Adds an item to the customer's product list.
             * @param {object} listId
             * @param {Object} item item to be added to the list.
             */
            async _createListItem(listId, item) {
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
            async _updateListItem(listId, item) {
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
            async _removeListItem(listId, itemId) {
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
            }
        }
    }, [customer.customerId, state])
    return self
}

/**
 * This hook is the "child class" of useCustomerProductLists.
 * It provides functionalities to manage a single wishlist for shoppers.
 */
export default function useWishlist() {
    const _super = useCustomerProductLists()
    const {actions} = useContext(CustomerProductListsContext)
    const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'
    const API_WISHLIST_TYPE = 'wish_list'

    const self = useMemo(() => {
        return {
            ..._super,

            get wishlist() {
                return Object.values(self.productLists).find(
                    (list) => list.name === PWA_DEFAULT_WISHLIST_NAME
                )
            },

            /**
             * Initialize customer's wishlist.
             * This should only be used during shopper login.
             */
            async init() {
                actions.setLoading(true)
                const productLists = await self._getOrCreateWishlist()
                const wishlist = productLists.data.find(
                    (list) => list.name === PWA_DEFAULT_WISHLIST_NAME
                )
                const productDetails = await self._getProductsInList(wishlist)
                actions.setLoading(false)

                // merge product details into the list
                const result = productLists.data.map((list) => {
                    if (list.id === wishlist.id) {
                        list.customerProductListItems = list.customerProductListItems?.map(
                            (item) => {
                                return {
                                    ...productDetails.data.find(
                                        (product) => product.id === item.productId
                                    ),
                                    ...item
                                }
                            }
                        )
                    }
                    return list
                })

                actions.receiveLists(result)
            },

            async createWishlistItem(item) {
                const createdItem = await self._createListItem(self.wishlist.id, item)
                actions.createListItem(self.wishlist.id, createdItem)
            },

            async updateWishlistItem(item) {
                const {id, quantity} = item
                if (quantity === 0) {
                    await self._removeListItem(self.wishlist.id, id)
                    actions.removeListItem(self.wishlist.id, id)
                    return
                }
                const updatedItem = await self._updateListItem(self.wishlist.id, item)
                actions.updateListItem(self.wishlist.id, updatedItem)
            },

            /**
             * Fetches product lists for registered users or creates a new list if none exist
             * due to the api limitation, we can not get the list based on type but all lists
             * @returns product lists for registered users
             */
            async _getOrCreateWishlist() {
                let response = await self._getLists()

                if (!response.data.some((list) => list.name === PWA_DEFAULT_WISHLIST_NAME)) {
                    await self._createList(PWA_DEFAULT_WISHLIST_NAME, API_WISHLIST_TYPE)
                    response = await self._getLists()
                }

                return response
            }
        }
    }, [_super])

    return self
}
