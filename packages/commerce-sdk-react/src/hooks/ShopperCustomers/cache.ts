/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClientConfigParams, ApiClients, CacheUpdateMatrix} from '../types'
import {and, matchesApiConfig, matchesPath, pathStartsWith} from '../utils'

type Client = ApiClients['shopperCustomers']

const noop = () => ({})
/** Logs a warning to console (on startup) and returns nothing (method is unimplemented). */
const TODO = (method: keyof Client) => {
    console.warn(`Cache logic for '${method}' is not yet implemented.`)
    return undefined
}
// Path helpers (avoid subtle typos!)
const getCustomerPath = (customerId: string, parameters: ApiClientConfigParams) => [
    '/organizations/',
    parameters.organizationId,
    '/customers/',
    customerId
]
const getProductListPath = (
    customerId: string,
    parameters: ApiClientConfigParams & {listId: string}
) => [...getCustomerPath(customerId, parameters), '/product-lists/', parameters.listId]
const getProductListItemPath = (
    customerId: string,
    parameters: ApiClientConfigParams & {listId: string; itemId: string}
) => [...getProductListPath(customerId, parameters), '/items/', parameters.itemId]
const getPaymentInstrumentPath = (
    customerId: string,
    parameters: ApiClientConfigParams & {paymentInstrumentId: string}
) => [
    ...getCustomerPath(customerId, parameters),
    '/payment-instruments/',
    parameters.paymentInstrumentId
]
const getCustomerAddressPath = (
    customerId: string,
    parameters: ApiClientConfigParams,
    address: string // Not a parameter because some endpoints use addressId and some use addressName
) => [...getCustomerPath(customerId, parameters), '/addresses/', address]

/** Invalidates the customer endpoint, but not derivative endpoints. */
const invalidateCustomer = (customerId: string, parameters: ApiClientConfigParams) => {
    return {
        invalidate: [
            and(matchesApiConfig(parameters), matchesPath(getCustomerPath(customerId, parameters)))
        ]
    }
}

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    authorizeCustomer: TODO('authorizeCustomer'),
    authorizeTrustedSystem: TODO('authorizeTrustedSystem'),
    createCustomerAddress(customerId, {parameters}, response) {
        if (!customerId) return {}
        // getCustomerAddress uses `addressName` rather than `addressId`
        const address = response.addressId
        const newParams = {...parameters, addressName: address}
        return {
            ...invalidateCustomer(customerId, parameters),
            update: [
                {queryKey: [...getCustomerAddressPath(customerId, newParams, address), newParams]}
            ]
        }
    },
    createCustomerPaymentInstrument(customerId, {parameters}, response) {
        if (!customerId) return {}
        const newParams = {...parameters, paymentInstrumentId: response.paymentInstrumentId}
        return {
            ...invalidateCustomer(customerId, parameters),
            update: [{queryKey: [...getPaymentInstrumentPath(customerId, newParams), newParams]}]
        }
    },
    createCustomerProductList(customerId, {parameters}, response) {
        if (!customerId) return {}
        const customerPath = getCustomerPath(customerId, parameters)
        // We always invalidate, because even without an ID we assume that something has changed
        const invalidate = [
            and(
                matchesApiConfig(parameters),
                // NOTE: This is the aggregate endpoint, so there's no trailing / on /product-lists
                matchesPath([...customerPath, '/product-lists'])
            )
        ]
        const listId = response.id
        // We can only update cache for this product list if we get the ID
        if (!listId) return {invalidate}
        const newParams = {...parameters, listId}
        return {
            invalidate,
            update: [{queryKey: [...getProductListPath(customerId, newParams), newParams]}]
        }
    },
    createCustomerProductListItem(customerId, {parameters}, response) {
        if (!customerId) return {}
        const itemId = response.id
        return {
            // We can only update cache if the response comes with an ID
            update: !itemId
                ? []
                : [
                      {
                          queryKey: [
                              ...getProductListItemPath(customerId, {...parameters, itemId}),
                              {...parameters, itemId}
                          ]
                      }
                  ],
            // We always invalidate, because even without an ID we assume that something has changed
            invalidate: [
                and(
                    matchesApiConfig(parameters),
                    matchesPath(getProductListPath(customerId, parameters))
                )
            ]
        }
    },
    deleteCustomerPaymentInstrument(customerId, {parameters}) {
        if (!customerId) return {}
        return {
            ...invalidateCustomer(customerId, parameters),
            remove: [
                and(
                    matchesApiConfig(parameters),
                    matchesPath(getPaymentInstrumentPath(customerId, parameters))
                )
            ]
        }
    },
    deleteCustomerProductList: TODO('deleteCustomerProductList'),
    deleteCustomerProductListItem(customerId, {parameters}) {
        if (!customerId) return {}
        return {
            invalidate: [
                and(
                    matchesApiConfig(parameters),
                    matchesPath(getProductListPath(customerId, parameters))
                )
            ],
            remove: [
                and(
                    matchesApiConfig(parameters),
                    matchesPath(getProductListItemPath(customerId, parameters))
                )
            ]
        }
    },
    getResetPasswordToken: noop,
    invalidateCustomerAuth: TODO('invalidateCustomerAuth'),
    registerCustomer: noop,
    registerExternalProfile: TODO('registerExternalProfile'),
    removeCustomerAddress(customerId, {parameters}) {
        if (!customerId) return {}
        return {
            ...invalidateCustomer(customerId, parameters),
            remove: [
                and(
                    matchesApiConfig(parameters),
                    matchesPath(
                        getCustomerAddressPath(customerId, parameters, parameters.addressName)
                    )
                )
            ]
        }
    },
    resetPassword: noop,
    updateCustomer(customerId, {parameters}) {
        if (!customerId) return {}
        const customerPath = getCustomerPath(customerId, parameters)
        return {
            update: [{queryKey: [...customerPath, parameters]}],
            // This is NOT invalidateCustomer(), as we want to invalidate *all* customer endpoints,
            // not just getCustomer
            invalidate: [and(matchesApiConfig(parameters), pathStartsWith(customerPath))]
        }
    },
    updateCustomerAddress(customerId, {parameters}) {
        if (!customerId) return {}
        return {
            // TODO: Rather than invalidating customer, can we selectively update its `addresses`?
            ...invalidateCustomer(customerId, parameters),
            update: [
                {
                    queryKey: [
                        ...getCustomerAddressPath(customerId, parameters, parameters.addressName),
                        parameters
                    ]
                }
            ]
        }
    },
    updateCustomerPassword: TODO('updateCustomerPassword'),
    updateCustomerProductList: TODO('updateCustomerProductList'),
    updateCustomerProductListItem(customerId, {parameters}) {
        if (!customerId) return {}
        const productListPath = getProductListPath(customerId, parameters)
        return {
            update: [{queryKey: [...getProductListItemPath(customerId, parameters), parameters]}],
            invalidate: [and(matchesApiConfig(parameters), matchesPath(productListPath))]
        }
    }
}
