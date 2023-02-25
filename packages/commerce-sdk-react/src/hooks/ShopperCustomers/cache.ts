/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getCustomerProductListItem, QueryKeys} from './queryKeyHelpers'
import {ApiClients, CacheUpdate, CacheUpdateMatrix, Tail} from '../types'
import {
    getCustomer,
    getCustomerAddress,
    getCustomerPaymentInstrument,
    getCustomerProductList,
    getCustomerProductLists
} from './queryKeyHelpers'

type Client = ApiClients['shopperCustomers']

const noop = () => ({})
/** Logs a warning to console (on startup) and returns nothing (method is unimplemented). */
const TODO = (method: keyof Client) => {
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}

/** Invalidates the customer endpoint, but not derivative endpoints. */
const invalidateCustomer = (parameters: Tail<QueryKeys['getCustomer']>): CacheUpdate => ({
    invalidate: [{queryKey: getCustomer.queryKey(parameters)}]
})

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    authorizeCustomer: TODO('authorizeCustomer'),
    authorizeTrustedSystem: TODO('authorizeTrustedSystem'),
    createCustomerAddress(customerId, {parameters}, response) {
        // getCustomerAddress uses `addressName` rather than `addressId`
        const newParams = {...parameters, addressName: response.addressId}
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(newParams),
            update: [{queryKey: getCustomerAddress.queryKey(newParams)}]
        }
    },
    createCustomerPaymentInstrument(customerId, {parameters}, response) {
        const newParams = {...parameters, paymentInstrumentId: response.paymentInstrumentId}
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(newParams),
            update: [{queryKey: getCustomerPaymentInstrument.queryKey(newParams)}]
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
            {queryKey: getCustomerProductList.queryKey(parameters)}
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
    deleteCustomerProductList: TODO('deleteCustomerProductList'),
    deleteCustomerProductListItem(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [{queryKey: getCustomerProductList.queryKey(parameters)}],
            remove: [{queryKey: getCustomerProductListItem.queryKey(parameters)}]
        }
    },
    getResetPasswordToken: noop,
    invalidateCustomerAuth: TODO('invalidateCustomerAuth'),
    registerCustomer: noop,
    registerExternalProfile: TODO('registerExternalProfile'),
    removeCustomerAddress(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(parameters),
            remove: [{queryKey: getCustomerAddress.queryKey(parameters)}]
        }
    },
    resetPassword: noop,
    updateCustomer(customerId, {parameters}) {
        return {
            update: [{queryKey: getCustomer.queryKey(parameters)}],
            // This is NOT invalidateCustomer(), as we want to invalidate *all* customer endpoints,
            // not just getCustomer
            invalidate: [{queryKey: getCustomer.path(parameters)}]
        }
    },
    updateCustomerAddress(customerId, {parameters}) {
        return {
            // TODO: Rather than invalidate, can we selectively update?
            ...invalidateCustomer(parameters),
            update: [{queryKey: getCustomerAddress.queryKey(parameters)}]
        }
    },
    updateCustomerPassword: TODO('updateCustomerPassword'),
    updateCustomerProductList: TODO('updateCustomerProductList'),
    updateCustomerProductListItem(customerId, {parameters}) {
        return {
            update: [{queryKey: getCustomerProductList.queryKey(parameters)}],
            // TODO: Rather than invalidate, can we selectively update?
            invalidate: [{queryKey: getCustomerProductListItem.queryKey(parameters)}]
        }
    }
}
