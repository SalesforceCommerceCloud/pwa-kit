/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo, useEffect, useState} from 'react'
import {isError, useCommerceAPI, CustomerProductListsContext} from '../utils'
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

export default function useCustomerProductLists({eventHandler = noop, errorHandler = noop} = {}) {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const {customerProductLists, setCustomerProductLists} = useContext(CustomerProductListsContext)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        eventQueue.process(async (event) => {
            const {action, item, list, listType} = event
            switch (action) {
                case CustomerProductListEventQueue.eventTypes.ADD: {
                    try {
                        const productList = self.getProductListPerType(listType)
                        const productListItem = productList.customerProductListItems.find(
                            ({productId}) => productId === event.item.id
                        )
                        // if the item is already in the wishlist
                        // only update the quantity
                        if (productListItem) {
                            await self.updateCustomerProductListItem(productList, {
                                ...productListItem,
                                quantity: event.item.quantity + productListItem.quantity
                            })
                            eventHandler(event)
                        } else {
                            await self.createCustomerProductListItem(productList, {
                                productId: event.item.id,
                                priority: 1,
                                quantity: parseInt(event.item.quantity),
                                public: false,
                                type: 'product'
                            })
                            eventHandler(event)
                        }
                    } catch (error) {
                        errorHandler(error)
                    }
                    break
                }

                case CustomerProductListEventQueue.eventTypes.REMOVE:
                    try {
                        await self.deleteCustomerProductListItem(list, item)
                        eventHandler(event)
                    } catch (error) {
                        errorHandler(error)
                    }
                    break
            }
        })
    }, [customerProductLists])

    const self = useMemo(() => {
        return {
            ...customerProductLists,
            get showLoader() {
                return isLoading
            },

            get loaded() {
                return customerProductLists?.data?.length
            },

            getProductListPerType(type) {
                return customerProductLists?.data.find((list) => list.type === type)
            },

            clearProductLists() {
                // clear out the product lists in context
                setCustomerProductLists({})
            },

            /**
             * Fetches product lists for registered users or creates a new list if none exist
             * due to the api limitation, we can not get the list based on type but all lists
             * @param {string} type type of list to fetch or create
             * @returns product lists for registered users
             */
            async fetchOrCreateProductLists(type) {
                setIsLoading(true)
                // fetch customer productLists
                const response = await api.shopperCustomers.getCustomerProductLists({
                    body: [],
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(false)
                if (isError(response)) {
                    throw new Error(response)
                }

                if (response?.data?.length && response?.data?.some((list) => list.type === type)) {
                    // only set the lists when there is at least one type we need. etc wishlist
                    return setCustomerProductLists(response)
                }

                setIsLoading(true)
                // create a new list to be used later
                const newProductList = await api.shopperCustomers.createCustomerProductList({
                    body: {
                        type
                    },
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(false)
                if (isError(newProductList)) {
                    throw new Error(newProductList)
                }
                // This function does not return an updated customerProductsList so we fetch manually
                await this.getCustomerProductLists()
            },

            /**
             * Fetches product lists for registered users
             * @returns product lists for registered users
             */
            async getCustomerProductLists() {
                setIsLoading(true)
                const response = await api.shopperCustomers.getCustomerProductLists({
                    body: [],
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(false)
                if (isError(response)) {
                    throw new Error(response)
                }

                setCustomerProductLists(response)
                return response
            },

            /**
             * @TODO: remove this function as it exposes unnecessary knowledge
             * to outside systems. The queue logic should be encapsulated in this
             * hook only. The API for outside consuming should be something like:
             * addItemToList, removeItemToList...
             * Event queue holds user actions that need to execute on product-lists
             * while the product list information has not yet loaded (eg: Adding to wishlist immedeately after login).
             * @param {object} event Event to be added to queue. event object has properties: action: {item: Object, list?: object, action: eventActions, listType: CustomerProductListType}
             */
            addActionToEventQueue(event) {
                eventQueue.enqueue(event)
            },

            /**
             * Creates a new customer product list
             * @param {Object} body object containing type property to define the type of list to be created
             */
            async createCustomerProductList(body) {
                setIsLoading(true)
                const response = await api.shopperCustomers.createCustomerProductList({
                    body,
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(true)
                if (isError(response)) {
                    throw new Error(response)
                }

                // This function does not return an updated customerProductsLists so we fetch manually
                await this.getCustomerProductLists()
                return response
            },

            /**
             * Adds an item to the customer's product list.
             * @param {object} list
             * @param {Object} item item to be added to the list.
             */
            async createCustomerProductListItem(list, item) {
                setIsLoading(true)
                const response = await api.shopperCustomers.createCustomerProductListItem({
                    body: item,
                    parameters: {
                        customerId: customer.customerId,
                        listId: list.id
                    }
                })

                setIsLoading(false)

                if (isError(response)) {
                    throw new Error(response)
                }

                // This function does not return an updated customerProductsList so we fetch manually
                await self.getCustomerProductLists()
                return response
            },

            /**
             * Returns a single customer's product list.
             * @param {string} listId id of the list to find.
             */
            getCustomerProductList(listId) {
                return customerProductLists.data.find((productList) => productList.id === listId)
            },

            /**
             * Updates a single customer's product list.
             * @param {object} list
             */
            updateCustomerProductList(list) {
                const updatedCustomerProductLists = {
                    ...customerProductLists,
                    data: customerProductLists.data.map((productList) =>
                        list.id === productList.id ? list : productList
                    )
                }
                setCustomerProductLists(updatedCustomerProductLists)
            },

            /**
             * Fetch list of product details from list of ids.
             * The maximum number of productIDs that can be requested are 24.
             * @param {string} ids list of productIds
             * @returns {Object[]} list of product details for requested productIds
             */
            async getProductsInList(ids, listId) {
                if (!ids) {
                    return
                }

                const response = await api.shopperProducts.getProducts({
                    parameters: {
                        ids
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                const itemDetail = response.data.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})

                const listToUpdate = this.getCustomerProductList(listId)

                this.updateCustomerProductList({
                    ...listToUpdate,
                    _productItemsDetail: {...listToUpdate._productItemsDetail, ...itemDetail}
                })
            },

            /**
             * Remove an item from a customerProductList
             * @param {object} list
             * @param {string} list.id id of list to remove item from
             * @param {object} item
             * @param {string} item.id id of item (in product-list not productId) to be removed
             */
            async deleteCustomerProductListItem(list, item) {
                // Delete item API returns a void response which throws a json parse error,
                // passing true as 2nd argument to get raw json response
                const response = await api.shopperCustomers.deleteCustomerProductListItem(
                    {
                        parameters: {
                            itemId: item.id,
                            listId: list.id,
                            customerId: customer.customerId
                        }
                    },
                    true
                )

                if (isError(response)) {
                    throw new Error(response)
                }

                // Remove item API does not return an updated list in response so we manually remove item
                // from state and update UI without requesting updated list from API
                const listToUpdate = this.getCustomerProductList(list.id)

                this.updateCustomerProductList({
                    ...listToUpdate,
                    customerProductListItems: listToUpdate.customerProductListItems.filter(
                        (x) => x.id !== item.id
                    )
                })
            },

            /**
             * Update an item from a customerProductList
             *
             * @param {object} list
             * @param {string} list.id id of the list to update the item in
             * @param {object} item
             * @param {string} item.id the id of the item in the product list
             * @param {number} item.quantity the quantity of the item
             */
            async updateCustomerProductListItem(list, item) {
                if (item.quantity === 0) {
                    return this.deleteCustomerProductListItem(list, item)
                }

                const response = await api.shopperCustomers.updateCustomerProductListItem({
                    body: item,
                    parameters: {
                        customerId: customer.customerId,
                        listId: list.id,
                        itemId: item.id
                    }
                })

                if (isError(response)) {
                    throw new Error(response)
                }

                // The response is the single updated item so we'll find that
                // item by its id and update it
                const listToUpdate = this.getCustomerProductList(list.id)

                this.updateCustomerProductList({
                    ...listToUpdate,
                    customerProductListItems: listToUpdate.customerProductListItems.map((item) =>
                        item.id === response.id ? response : item
                    )
                })
            }
        }
    }, [customer, customerProductLists, setCustomerProductLists, isLoading])
    return self
}
