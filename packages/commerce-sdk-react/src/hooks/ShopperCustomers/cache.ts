/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {Query} from '@tanstack/react-query'
import {getCustomerProductListItem, QueryKeys} from './queryKeyHelpers'
import {ApiClients, CacheUpdate, CacheUpdateMatrix, Tail} from '../types'
import {
    getCustomer,
    getCustomerAddress,
    getCustomerPaymentInstrument,
    getCustomerProductList,
    getCustomerProductLists
} from './queryKeyHelpers'
import {and, pathStartsWith} from '../utils'

type Client = ApiClients['shopperCustomers']
type CustomerAddress = ShopperCustomersTypes.CustomerAddress
type CustomerPaymentInstrument = ShopperCustomersTypes.CustomerPaymentInstrument
type CustomerProductList = ShopperCustomersTypes.CustomerProductList
type CustomerProductListResult = ShopperCustomersTypes.CustomerProductListResult

const noop = () => ({})

/** Invalidates the customer endpoint, but not derivative endpoints. */
const invalidateCustomer = (parameters: Tail<QueryKeys['getCustomer']>): CacheUpdate => ({
    invalidate: [{queryKey: getCustomer.queryKey(parameters)}]
})

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
                    updater: (oldData: CustomerAddress) => {
                        return {
                            ...oldData,
                            addresses: [...oldData?.addresses, response]
                        }
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
                    updater: (oldData: CustomerPaymentInstrument) => {
                        return {
                            ...oldData,
                            paymentInstruments: [...oldData?.paymentInstruments, response]
                        }
                    }
                }
            ]
        }
    },
    createCustomerProductList(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        // TODO: Rather than invalidate, can we selectively update?
        const invalidate: CacheUpdate['invalidate'] = [
            {queryKey: getCustomerProductLists.queryKey(parameters)}
        ]
        // We can only update cache for this product list if we have the ID
        const listId = response.id
        if (!listId) return {invalidate}
        return {
            invalidate,
            update: [{queryKey: getCustomerProductList.queryKey({...parameters, listId})}]
        }
    },
    createCustomerProductListItem(customerId, {parameters}, response) {
        // We always invalidate, because even without an ID we assume that something has changed
        // TODO: Rather than invalidate, can we selectively update?
        const invalidate: CacheUpdate['invalidate'] = [
            {queryKey: getCustomerProductList.queryKey(parameters)},
            {queryKey: getCustomerProductLists.queryKey(parameters)}
        ]
        // We can only update cache for this product list item if we have the ID
        const itemId = response.id
        if (!itemId) return {invalidate}
        return {
            invalidate,
            update: [{queryKey: getCustomerProductListItem.queryKey({...parameters, itemId})}]
        }
    },
    deleteCustomerPaymentInstrument(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(parameters),
            remove: [{queryKey: getCustomerPaymentInstrument.queryKey(parameters)}]
        }
    },
    deleteCustomerProductList(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [{queryKey: getCustomerProductLists.queryKey(parameters)}],
            remove: [{queryKey: getCustomerProductList.path(parameters)}]
        }
    },
    deleteCustomerProductListItem(customerId, {parameters}) {
        // TODO: Dry me up.
        const findCustomerProductListItemIndex = (list: CustomerProductList, itemId: string) => {
            const matchIdx = list?.customerProductListItems?.findIndex(
                ({id}) => id === parameters.itemId
            )

            return matchIdx
        }

        return {
            update: [
                {
                    queryKey: getCustomerProductList.queryKey(parameters),
                    updater: (oldData: CustomerProductList) => {
                        const matchIdx = findCustomerProductListItemIndex(
                            oldData,
                            parameters.itemId
                        )

                        // Return if there is no match.
                        if (!matchIdx) {
                            return
                        }

                        // Copy list and remove item.
                        const newCustomerProductList = {...oldData}
                        if (matchIdx > -1) {
                            newCustomerProductList?.customerProductListItems?.splice(matchIdx, 1)
                        }

                        return {
                            ...newCustomerProductList
                        }
                    }
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newCustomerProductListResult = {...oldData}
                        const listMatchIndex = newCustomerProductListResult?.data.findIndex(
                            ({id}) => id === parameters.listId
                        )

                        if (listMatchIndex > -1) {
                            const itemMatchIndex = findCustomerProductListItemIndex(
                                newCustomerProductListResult.data[listMatchIndex],
                                parameters.itemId
                            )

                            if (itemMatchIndex) {
                                newCustomerProductListResult.data[
                                    listMatchIndex
                                ]?.customerProductListItems?.splice(itemMatchIndex, 1)
                            }
                        }

                        return newCustomerProductListResult
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
                    updater: (oldData: CustomerAddress) => {
                        const newAddresses = [...oldData?.addresses]
                        const matchIdx = newAddresses.findIndex(
                            ({addressId}) => addressId === parameters.addressName
                        )
                        if (matchIdx > -1) {
                            newAddresses.splice(matchIdx, 1)
                        }

                        return {
                            ...oldData,
                            addresses: newAddresses
                        }
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
                    updater: (oldData: CustomerAddress) => {
                        const newAddresses = [...oldData?.addresses]
                        const matchIdx = newAddresses.findIndex(
                            ({addressId}) => addressId === response.addressId
                        )
                        if (matchIdx > -1) {
                            newAddresses[matchIdx] = response
                        }

                        return {
                            ...oldData,
                            addresses: newAddresses
                        }
                    }
                }
            ]
        }
    },
    updateCustomerPassword: noop,
    updateCustomerProductList(customerId, {parameters}) {
        return {
            update: [{queryKey: getCustomerProductList.queryKey(parameters)}],
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [{queryKey: getCustomerProductLists.queryKey(parameters)}]
        }
    },
    updateCustomerProductListItem(customerId, {parameters}, response) {
        const findCustomerProductListItemIndex = (list: CustomerProductList, itemId: string) => {
            const matchIdx = list?.customerProductListItems?.findIndex(
                ({id}) => id === parameters.itemId
            )

            return matchIdx
        }

        return {
            update: [
                {
                    queryKey: getCustomerProductListItem.queryKey(parameters)
                },
                {
                    queryKey: getCustomerProductList.queryKey(parameters),
                    updater: (oldData: CustomerProductList) => {
                        const matchIdx = findCustomerProductListItemIndex(
                            oldData,
                            parameters.itemId
                        )

                        // Return if there is no match.
                        if (!matchIdx) {
                            return
                        }

                        // Copy list and remove item.
                        const newCustomerProductList = {...oldData}
                        if (matchIdx > -1 && newCustomerProductList.customerProductListItems) {
                            newCustomerProductList.customerProductListItems[matchIdx] = response
                        }

                        return {
                            ...newCustomerProductList
                        }
                    }
                },
                {
                    queryKey: getCustomerProductLists.queryKey(parameters),
                    updater: (oldData: CustomerProductListResult) => {
                        if (!oldData) {
                            return
                        }

                        const newCustomerProductListResult = {...oldData}
                        const listMatchIndex = newCustomerProductListResult?.data.findIndex(
                            ({id}) => id === parameters.listId
                        )

                        if (listMatchIndex > -1) {
                            const itemMatchIndex = findCustomerProductListItemIndex(
                                newCustomerProductListResult.data[listMatchIndex],
                                parameters.itemId
                            )

                            const list  = newCustomerProductListResult.data[listMatchIndex].customerProductListItems
                            if (itemMatchIndex && list) {
                                list[itemMatchIndex] = response 
                            }
                        }

                        return newCustomerProductListResult
                    }
                }
            ]
        }
    }
}
