/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {Query} from '@tanstack/react-query'
import clone from 'clone'
import {getCustomerProductListItem} from './queryKeyHelpers'
import {ApiClients, CacheUpdateMatrix} from '../types'
import {
    getCustomer,
    getCustomerAddress,
    getCustomerPaymentInstrument,
    getCustomerProductList,
    getCustomerProductLists
} from './queryKeyHelpers'
import {and, pathStartsWith} from '../utils'

type Client = ApiClients['shopperCustomers']
type Customer = ShopperCustomersTypes.Customer
type CustomerProductList = ShopperCustomersTypes.CustomerProductList
type CustomerProductListResult = ShopperCustomersTypes.CustomerProductListResult

const noop = () => ({})

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
                    updater: (oldData: Customer) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        // Push new address onto the end of addresses list.
                        newData.addresses?.push(response)

                        return newData
                    }
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
                    updater: (oldData: Customer) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        // Add the new payment instrument to the end of the list
                        newData.paymentInstruments?.push(response)

                        return newData
                    }
                }
            ]
        }
    },
    createCustomerProductList(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        // QUESTION: Why would we not have and ID?
        const listId = response.id
        return {
            update: [
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        // Add new list to front of the lists.
                        newData.data.unshift(response)
                        newData.total++
                        newData.limit++

                        return newData
                    }
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
                    updater: (oldData: CustomerProductList) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        newData.customerProductListItems?.push(response)
                        // console.log('updater: ', oldData, newData)
                        return newData
                    }
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: (oldData: CustomerProductListResult) => {
                        console.log('updater --> oldData: ', oldData)
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        // Find the list that we want to add the item to.
                        const listIndex = newData.data.findIndex(({id}) => id === parameters.listId)

                        // Push the new item onto the end of the list.
                        if (listIndex < 0) {
                            return
                        }
                        console.log('updater: ', oldData, newData)
                        newData.data[listIndex].customerProductListItems?.push(response)

                        return newData
                    }
                }
            ]
        }
    },
    deleteCustomerPaymentInstrument(customerId, {parameters}) {
        return {
            update: [
                {
                    queryKey: getCustomer.queryKey(parameters),
                    updater: (oldData: Customer) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        const paymentInstrumentIndex = newData?.paymentInstruments?.findIndex(
                            ({paymentInstrumentId}) =>
                                paymentInstrumentId === parameters.paymentInstrumentId
                        )

                        // Return undefined if no payment instrument was found.
                        if (
                            typeof paymentInstrumentIndex === 'undefined' ||
                            paymentInstrumentIndex < 0
                        ) {
                            return
                        }

                        // Remove the found payment instrument.
                        newData?.paymentInstruments?.splice(paymentInstrumentIndex, 1)

                        return newData
                    }
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
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        const listIndex = newData.data.findIndex(({id}) => id === parameters.listId)

                        // Return undefined if no list is found
                        if (listIndex < 0) {
                            return
                        }

                        // Remove the list from the result object
                        newData.data.splice(listIndex, 1)
                        newData.limit--
                        newData.total--

                        return newData
                    }
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
                    updater: (oldData: CustomerProductList) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        const itemIndex = newData.customerProductListItems?.findIndex(
                            ({id}) => id === parameters.itemId
                        )

                        // Return undefined if there is no item found.
                        if (typeof itemIndex === 'undefined' || itemIndex < 0) {
                            return
                        }

                        // Remove the list item
                        newData.customerProductListItems?.splice(itemIndex, 1)

                        return newData
                    }
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        const listIndex = newData?.data.findIndex(
                            ({id}) => id === parameters.listId
                        )
                        const itemIndex = newData?.data?.[
                            listIndex
                        ]?.customerProductListItems?.findIndex(({id}) => id === parameters.itemId)

                        // Return undefined if no item was found in the provided list.
                        if (listIndex < 0 || typeof itemIndex === 'undefined' || itemIndex < 0) {
                            return
                        }

                        // Remove the item from the list.
                        newData.data[listIndex]?.customerProductListItems?.splice(itemIndex, 1)

                        return newData
                    }
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
                    updater: (oldData: Customer) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        const addressIndex = newData?.addresses?.findIndex(
                            ({addressId}) => addressId === parameters.addressName
                        )

                        // Return undefined if the address is not found...
                        if (typeof addressIndex === 'undefined' || addressIndex < 0) {
                            return
                        }

                        // Rmove the found address.
                        newData?.addresses?.splice(addressIndex, 1)

                        return newData
                    }
                }
            ],
            remove: [{queryKey: getCustomerAddress.queryKey(parameters)}]
        }
    },
    resetPassword: noop,
    updateCustomer(customerId, {parameters}) {
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
            update: [{queryKey: getCustomer.queryKey(parameters)}],
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
                    updater: (oldData: Customer) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        const addressIndex = newData?.addresses?.findIndex(
                            ({addressId}) => addressId === response.addressId
                        )

                        // Return undefined if no address is found...
                        if (typeof addressIndex === 'undefined' || addressIndex < 0) {
                            return
                        }

                        // Update the found address.
                        newData.addresses![addressIndex] = response

                        return newData
                    }
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
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)
                        const listIndex = newData.data.findIndex(({id}) => id === response.id)

                        // Return undefined if we didn't find the product list we were looking for.
                        if (listIndex < 0) {
                            return
                        }

                        // Update the product list.
                        newData.data[listIndex] = response

                        return newData
                    }
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
                    updater: (oldData: CustomerProductList) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        // Find the index of the item we want to update.
                        const itemIndex = newData.customerProductListItems?.findIndex(
                            ({id}) => id === parameters.itemId
                        )

                        // Return undefined when item isn't found.
                        if (typeof itemIndex === 'undefined' || itemIndex < 0) {
                            return
                        }

                        // Make a copy of the list we are mutating as to leave the original alone.
                        newData.customerProductListItems![itemIndex] = response

                        return newData
                    }
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newData = clone(oldData)

                        // Find the list with the current list id.
                        const listIndex = newData.data.findIndex(({id}) => id === parameters.listId)
                        // Find the index of the item in the list.
                        const itemIndex = newData?.data[
                            listIndex
                        ]?.customerProductListItems?.findIndex(({id}) => id === parameters.itemId)

                        // Return undefined if item isn't found...
                        if (listIndex < 0 || typeof itemIndex === 'undefined' || itemIndex < 0) {
                            return
                        }

                        // Update the item in the found list.
                        // NOTE: We know that there is an item to update given the item index is > -1
                        newData.data[listIndex].customerProductListItems![itemIndex] = response

                        return newData
                    }
                }
            ]
        }
    }
}
