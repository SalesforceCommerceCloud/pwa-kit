/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {Query} from '@tanstack/react-query'
import {getCustomerProductListItem} from './queryKeyHelpers'
import {ApiClients, CacheUpdateMatrix} from '../types'
import {
    getCustomer,
    getCustomerAddress,
    getCustomerPaymentInstrument,
    getCustomerProductList,
    getCustomerProductLists
} from './queryKeyHelpers'
import {and, clone, pathStartsWith} from '../utils'

type Client = ApiClients['shopperCustomers']
type Customer = ShopperCustomersTypes.Customer
type CustomerProductList = ShopperCustomersTypes.CustomerProductList
type CustomerProductListResult = ShopperCustomersTypes.CustomerProductListResult

const noop = () => ({})

// ReactQuery type def for the updater function uses type `unknown` for the first param,
// this makes it hard to define the `createUpdateFunction` below, so we created this type.
type Updater<T> = (data: T | undefined) => T | undefined

// This is a slight variation of above, but we know the data is not null.
type DataProcessor<T> = (data: NonNullable<T>) => T

/**
 * Create an update handler for the cache matrix. This updater will implicitly clone and assert
 * that the data being passed to is is not undefined.
 *
 * @param update
 * @returns
 */
const createUpdateFunction =
    <T>(update: DataProcessor<T>): Updater<T> =>
    (data) =>
        data ? update(clone(data)) : undefined

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    createCustomerAddress(customerId, {parameters}, response) {
        // getCustomerAddress uses `addressName` rather than `addressId`
        const newParams = {...parameters, addressName: response.addressId}
        return {
            update: [
                {
                    queryKey: getCustomerAddress.queryKey(newParams)
                },
                {
                    queryKey: getCustomer.queryKey(newParams),
                    updater: createUpdateFunction((customer: Customer) => {
                        // Push new address onto the end of addresses list.
                        customer.addresses = [...(customer.addresses ?? []), response]

                        return customer
                    })
                }
            ]
        }
    },
    createCustomerPaymentInstrument(customerId, {parameters}, response) {
        const newParams = {...parameters, paymentInstrumentId: response.paymentInstrumentId}
        return {
            update: [
                {
                    queryKey: getCustomerPaymentInstrument.queryKey(newParams)
                },
                {
                    queryKey: getCustomer.queryKey(newParams),
                    updater: createUpdateFunction((customer: Customer) => {
                        customer.paymentInstruments = [
                            ...(customer.paymentInstruments ?? []),
                            response
                        ]

                        return customer
                    })
                }
            ]
        }
    },
    createCustomerProductList(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        const listId = response.id
        return {
            update: [
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: createUpdateFunction((result: CustomerProductListResult) => {
                        // if a user has no product list, data will not present in the response.
                        if (!result.data) {
                            result.data = [response]
                        } else {
                            // Add new list to front of the lists.
                            result.data.unshift(response)
                        }

                        result.limit++
                        result.total++
                        return result
                    })
                },
                {
                    queryKey: getCustomerProductList.queryKey({...parameters, listId})
                }
            ]
        }
    },
    createCustomerProductListItem(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        // QUESTION: Why would we get a response that doesn't have an ID?
        const itemId = response.id

        return {
            update: [
                {
                    queryKey: getCustomerProductListItem.queryKey({...parameters, itemId})
                },
                {
                    queryKey: getCustomerProductList.queryKey(parameters),
                    updater: createUpdateFunction((list: CustomerProductList) => {
                        return {
                            ...list,
                            customerProductListItems: [
                                ...(list?.customerProductListItems || []),
                                response
                            ]
                        }
                    })
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: createUpdateFunction((result: CustomerProductListResult) => {
                        // Find the list that we want to add the item to.
                        const list = result.data.find(({id}) => id === parameters.listId)

                        if (!list) {
                            return
                        }

                        list.customerProductListItems = [
                            ...(list.customerProductListItems ?? []),
                            response
                        ]

                        return result
                    })
                }
            ]
        }
    },
    deleteCustomerPaymentInstrument(customerId, {parameters}) {
        return {
            update: [
                {
                    queryKey: getCustomer.queryKey(parameters),
                    updater: createUpdateFunction((customer: Customer) => {
                        const paymentInstrumentIndex = customer.paymentInstruments?.findIndex(
                            ({paymentInstrumentId}) =>
                                paymentInstrumentId === parameters.paymentInstrumentId
                        )

                        // Return undefined (no changes) if no payment instrument was found.
                        if (paymentInstrumentIndex === undefined || paymentInstrumentIndex < 0) {
                            return
                        }

                        // Remove the found payment instrument.
                        customer.paymentInstruments?.splice(paymentInstrumentIndex, 1)

                        return customer
                    })
                }
            ],
            remove: [{queryKey: getCustomerPaymentInstrument.queryKey(parameters)}]
        }
    },
    deleteCustomerProductList(customerId, {parameters}) {
        return {
            update: [
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: createUpdateFunction((result: CustomerProductListResult) => {
                        const listIndex = result.data.findIndex(({id}) => id === parameters.listId)

                        // Return undefined if no list is found
                        if (listIndex < 0) {
                            return
                        }

                        // Remove the list from the result object
                        result.data.splice(listIndex, 1)
                        result.limit--
                        result.total--

                        return result
                    })
                }
            ],
            remove: [{queryKey: getCustomerProductList.path(parameters)}]
        }
    },
    deleteCustomerProductListItem(customerId, {parameters}) {
        return {
            update: [
                {
                    queryKey: getCustomerProductList.queryKey(parameters),
                    updater: createUpdateFunction((list: CustomerProductList) => {
                        const itemIndex = list.customerProductListItems?.findIndex(
                            ({id}) => id === parameters.itemId
                        )

                        // Return undefined if there is no item found.
                        if (itemIndex === undefined || itemIndex < 0) {
                            return
                        }

                        // Remove the list item
                        list.customerProductListItems?.splice(itemIndex, 1)

                        return list
                    })
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: createUpdateFunction((result: CustomerProductListResult) => {
                        const list = result.data.find(({id}) => id === parameters.listId)
                        const itemIndex = list?.customerProductListItems?.findIndex(
                            ({id}) => id === parameters.itemId
                        )

                        // Return undefined if no item was found in the provided list.
                        if (itemIndex === undefined || itemIndex < 0) {
                            return
                        }

                        // Remove the item from the list.
                        list?.customerProductListItems?.splice(itemIndex, 1)

                        return result
                    })
                }
            ],
            remove: [{queryKey: getCustomerProductListItem.queryKey(parameters)}]
        }
    },
    getResetPasswordToken: noop,
    // TODO: Should this update the `getCustomer` cache?
    registerCustomer: noop,
    // TODO: Implement when the endpoint exits closed beta.
    // registerExternalProfile: TODO('registerExternalProfile'),
    removeCustomerAddress(customerId, {parameters}) {
        return {
            update: [
                {
                    queryKey: getCustomer.queryKey(parameters),
                    updater: createUpdateFunction((customer: Customer) => {
                        const addressIndex = customer.addresses?.findIndex(
                            ({addressId}) => addressId === parameters.addressName
                        )

                        // Return undefined if the address is not found...
                        if (addressIndex === undefined || addressIndex < 0) {
                            return
                        }

                        // Remove the found address.
                        customer.addresses?.splice(addressIndex, 1)

                        return customer
                    })
                }
            ],
            remove: [{queryKey: getCustomerAddress.queryKey(parameters)}]
        }
    },
    resetPassword: noop,
    updateCustomer(customerId, {parameters}, response) {
        // When we update a customer, we don't know what data has changed, so we must invalidate all
        // derivative endpoints. They conveniently all start with the same path as `getCustomer`,
        // but we do NOT want to invalidate `getCustomer` itself, we want to _update_ it. (Ideally,
        // we could invalidate *then* update, but React Query can't handle that.) To do so, we
        // examine the path of each cached query. If it starts with the `getCustomer` path, we
        // invalidate, UNLESS the first item afer the path is an object, because that means that it
        // is the `getCustomer` query itself.
        const path = getCustomer.path(parameters)
        const isNotGetCustomer = ({queryKey}: Query) => typeof queryKey[path.length] !== 'object'
        const predicate = and(pathStartsWith(path), isNotGetCustomer)
        return {
            update: [
                {
                    queryKey: getCustomer.queryKey(parameters),
                    updater: createUpdateFunction((customer: Customer) => {
                        // The `updateCustomer` endpoint does not return exhaustive customer data. It
                        // is missing data for `addresses` and `paymentInstruments`, to name a few. Here
                        // we ensure that any customer data we have is preserved.
                        return {
                            ...customer,
                            ...response
                        }
                    })
                }
            ],
            invalidate: [{predicate}]
        }
    },
    updateCustomerAddress(customerId, {parameters}, response) {
        return {
            update: [
                {
                    queryKey: getCustomerAddress.queryKey(parameters)
                },
                {
                    queryKey: getCustomer.queryKey(parameters),
                    updater: createUpdateFunction((customer: Customer) => {
                        if (!customer.addresses) return
                        const addressIndex = customer.addresses.findIndex(
                            ({addressId}) => addressId === response.addressId
                        )

                        // Return undefined if no address is found...
                        if (addressIndex === undefined || addressIndex < 0) {
                            return
                        }

                        // Update the found address.
                        customer.addresses[addressIndex] = response

                        return customer
                    })
                }
            ]
        }
    },
    updateCustomerPassword: noop,
    updateCustomerProductList(customerId, {parameters}, response) {
        return {
            update: [
                {
                    queryKey: getCustomerProductList.queryKey(parameters)
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: createUpdateFunction((result: CustomerProductListResult) => {
                        const listIndex = result.data.findIndex(({id}) => id === response.id)

                        // Return undefined if we didn't find the product list we were looking for.
                        if (listIndex < 0) {
                            return
                        }

                        // Update the product list.
                        result.data[listIndex] = response

                        return result
                    })
                }
            ]
        }
    },
    updateCustomerProductListItem(customerId, {parameters}, response) {
        return {
            update: [
                {
                    queryKey: getCustomerProductListItem.queryKey(parameters)
                },
                {
                    queryKey: getCustomerProductList.queryKey(parameters),
                    updater: createUpdateFunction((list: CustomerProductList) => {
                        if (!list.customerProductListItems) return
                        // Find the index of the item we want to update.
                        const itemIndex = list.customerProductListItems?.findIndex(
                            ({id}) => id === parameters.itemId
                        )

                        // Return undefined when item isn't found.
                        if (itemIndex === undefined || itemIndex < 0) {
                            return
                        }

                        list.customerProductListItems[itemIndex] = response

                        return list
                    })
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: createUpdateFunction((result: CustomerProductListResult) => {
                        // Find the list with the current list id.
                        const listIndex = result.data.findIndex(({id}) => id === parameters.listId)
                        // Find the index of the item in the list.
                        const items = result.data[listIndex].customerProductListItems

                        if (!items) return

                        const itemIndex = items.findIndex(({id}) => id === parameters.itemId)

                        // Return undefined if item isn't found...
                        if (itemIndex === undefined || itemIndex < 0) return

                        // Update the item in the found list.
                        // NOTE: We know that there is an item to update given the item index is > -1
                        items[itemIndex] = response

                        return result
                    })
                }
            ]
        }
    }
}
