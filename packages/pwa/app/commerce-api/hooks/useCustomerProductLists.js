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

    const self = useMemo(() => {
        return {
            ...state,

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

            async createList(name, type) {
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
             * Fetches product lists for registered users or creates a new list if none exist
             * due to the api limitation, we can not get the list based on type but all lists
             * @returns product lists for registered users
             */
            async getOrCreateWishlist(name, type) {
                let response = await self._getLists()

                if (!response.data.some((list) => list.name === name)) {
                    await self._createList(name, type)
                    response = await self._getLists()
                }

                return response
            }
        }
    }, [customer.customerId, state])

    return self
}

const DEFAULT_LIST_TYPE = 'NOT SURE WHAT THE DEFAULT SHOULD BE, OR IF WE HSAVE TO SUPPLY ONE.'

// Below is an example on how you can react a hook specifically for the wishlist defined in the project.
// app/hooks/useWishlist.js
// const useWishlist = () => useCustomerProductList('PWA_WISHLIST', 'WISHLIST')

// NOTE: This is a forward thinking on how we can keep some of the post login logic in the app and not in the
// commerceAPI that might be refactored into the SDK.
// cosnt api = new CommerceAPI(args, {
//     afterLogin: () => {
//         shoppinglist = useCustomerProductList('PWA_WISHLIST', 'SHOPPINGLIST')
//     }
// })

/**
 *
 * @param {*} listId
 * @returns
 */
export function useCustomerProductList(listId, options = {}) {
    const customerProductLists = useCustomerProductLists()
    const type = options || DEFAULT_LIST_TYPE

    const api = useCommerceAPI()
    const customer = useCustomer()

    // NOTE: If you are changing the way that we use state for the hooks, we need to ensure
    // that the state for lists is not initialized in THIS hook, but the parent `useCustomerProductLists`
    // hook. Doing so will ensure that we aren't making a new request each time we use the `useWishlistHook`.
    const {state, actions} = useContext(CustomerProductListsContext)

    const init = async () => {
        // NOTE: Do other init stuff. I think this set loading is only for the product lists,
        // and not individual lists. So we probably don't need it.
        actions.setLoading(listId, true)

        // NOTE: Do we want to make a request everytime the hook is called? or should it be smart enough
        // to know it has the list loaded already and return that?
        await customerProductLists.getOrCreateWishlist(listId, type)

        actions.setLoading(listId, false)
    }

    // NOTE: In other hooks we use an `init` function. I'm not sure if that is the correct thing to do,
    // or if this is. I personally feel like if I use a hook, at least for a product list, it should happen
    // automatically.
    init()

    const self = useMemo(() => {
        return {
            ...state.productLists[listId],

            /**
             * Adds an item to the customer's product list.
             * @param {object} listId
             * @param {Object} item item to be added to the list.
             */
            async createListItem(item) {
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

                actions.createListItem(listId, response)
            },

            /**
             * Update an item in a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {object} item
             * @param {string} item.id the id of the item in the product list
             * @param {number} item.quantity the quantity of the item
             */
            async updateListItem(item) {
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

                actions.updateListItem(listId, response)
            },

            /**
             * Remove an item from a customer product list
             *
             * @param {string} listId id of the list to update the item in
             * @param {string} itemId the id of the item in the product list
             */
            async removeListItem(itemId) {
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
