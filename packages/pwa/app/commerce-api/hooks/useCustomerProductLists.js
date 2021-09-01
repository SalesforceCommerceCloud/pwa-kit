/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo, useEffect, useState} from 'react'
import {useCommerceAPI, CustomerProductListsContext} from '../contexts'
import {isError} from '../utils'
import {noop} from '../../utils/utils'

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

const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'
const WISHLIST_TYPE = 'wish_list'

export default function useCustomerProductLists({eventHandler = noop, errorHandler = noop} = {}) {
    const api = useCommerceAPI()
    const customer = useCustomer()
    // const {customerProductLists, setCustomerProductLists} = useContext(CustomerProductListsContext)
    const {state, actions} = useContext(CustomerProductListsContext)
    // const [isLoading, setIsLoading] = useState(false)

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
    //                         await self.updateCustomerProductListItem(productList, {
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
            // ...customerProductLists,
            ...state,

            /**
             * Initialize customer's product lists.
             * This should only be used during customer login.
             */
            async init() {
                const productLists = await this._getOrCreateProductLists()
                const defaultList = productLists.data.find(
                    (list) => list.name === PWA_DEFAULT_WISHLIST_NAME
                )
                const productDetails = await this._getProductsInList(defaultList)

                // merge product details into the list
                const result = productLists.data.map((list) => {
                    if (list.id === defaultList.id) {
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

                actions.receive(result)
            },

            reset() {
                actions.reset()
            },

            // get showLoader() {
            //     return isLoading
            // },

            // get loaded() {
            //     return customerProductLists?.data?.length
            // },

            // getProductListPerType(type) {
            //     return customerProductLists?.data.find((list) => list.type === type)
            // },

            /**
             * Fetches product lists for registered users or creates a new list if none exist
             * due to the api limitation, we can not get the list based on type but all lists
             * @param {string} type type of list to fetch or create
             * @returns product lists for registered users
             */
            async _getOrCreateProductLists() {
                let response = await self._getProductLists()

                if (!response.data.some((list) => list.name === PWA_DEFAULT_WISHLIST_NAME)) {
                    await self._createProductList()
                    response = await self._getProductLists()
                }

                return response
            },

            async _getProductLists() {
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

            async _createProductList(name = PWA_DEFAULT_WISHLIST_NAME, type = WISHLIST_TYPE) {
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

            // /**
            //  * Adds an item to the customer's product list.
            //  * @param {object} list
            //  * @param {Object} item item to be added to the list.
            //  */
            // async createCustomerProductListItem(list, item) {
            //     setIsLoading(true)
            //     const response = await api.shopperCustomers.createCustomerProductListItem({
            //         body: item,
            //         parameters: {
            //             customerId: customer.customerId,
            //             listId: list.id
            //         }
            //     })

            //     setIsLoading(false)

            //     if (isError(response)) {
            //         throw new Error(response)
            //     }

            //     // This function does not return an updated customerProductsList so we fetch manually
            //     await self.getCustomerProductLists()
            //     return response
            // },

            // /**
            //  * Returns a single customer's product list.
            //  * @param {string} listId id of the list to find.
            //  */
            // getCustomerProductList(listId) {
            //     return customerProductLists.data.find((productList) => productList.id === listId)
            // },

            // /**
            //  * Updates a single customer's product list.
            //  * @param {object} list
            //  */
            // updateCustomerProductList(list) {
            //     const updatedCustomerProductLists = {
            //         ...customerProductLists,
            //         data: customerProductLists.data.map((productList) =>
            //             list.id === productList.id ? list : productList
            //         )
            //     }
            //     setCustomerProductLists(updatedCustomerProductLists)
            // },

            // /**
            //  * Remove an item from a customerProductList
            //  * @param {object} list
            //  * @param {string} list.id id of list to remove item from
            //  * @param {object} item
            //  * @param {string} item.id id of item (in product-list not productId) to be removed
            //  */
            // async deleteCustomerProductListItem(list, item) {
            //     // Delete item API returns a void response which throws a json parse error,
            //     // passing true as 2nd argument to get raw json response
            //     const response = await api.shopperCustomers.deleteCustomerProductListItem(
            //         {
            //             parameters: {
            //                 itemId: item.id,
            //                 listId: list.id,
            //                 customerId: customer.customerId
            //             }
            //         },
            //         true
            //     )

            //     if (isError(response)) {
            //         throw new Error(response)
            //     }

            //     // Remove item API does not return an updated list in response so we manually remove item
            //     // from state and update UI without requesting updated list from API
            //     const listToUpdate = this.getCustomerProductList(list.id)

            //     this.updateCustomerProductList({
            //         ...listToUpdate,
            //         customerProductListItems: listToUpdate.customerProductListItems.filter(
            //             (x) => x.id !== item.id
            //         )
            //     })
            // },

            // /**
            //  * Update an item from a customerProductList
            //  *
            //  * @param {object} list
            //  * @param {string} list.id id of the list to update the item in
            //  * @param {object} item
            //  * @param {string} item.id the id of the item in the product list
            //  * @param {number} item.quantity the quantity of the item
            //  */
            // async updateCustomerProductListItem(list, item) {
            //     if (item.quantity === 0) {
            //         return this.deleteCustomerProductListItem(list, item)
            //     }

            //     const response = await api.shopperCustomers.updateCustomerProductListItem({
            //         body: item,
            //         parameters: {
            //             customerId: customer.customerId,
            //             listId: list.id,
            //             itemId: item.id
            //         }
            //     })

            //     if (isError(response)) {
            //         throw new Error(response)
            //     }

            //     // The response is the single updated item so we'll find that
            //     // item by its id and update it
            //     const listToUpdate = this.getCustomerProductList(list.id)

            //     this.updateCustomerProductList({
            //         ...listToUpdate,
            //         customerProductListItems: listToUpdate.customerProductListItems.map((item) =>
            //             item.id === response.id ? response : item
            //         )
            //     })
            // }
        }
    }, [customer.customerId, state])
    return self
}
