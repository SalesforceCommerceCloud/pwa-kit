/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {
    ApiClients,
    ApiOptions,
    CacheUpdate,
    CacheUpdateMatrix,
    CacheUpdateUpdate,
    MergedOptions
} from '../types'
import {and, matchesApiConfig, NotImplementedError, pathStartsWith} from '../utils'

type Client = ApiClients['shopperCustomers']
type Customer = ShopperCustomersTypes.Customer
type CustomerOptions = MergedOptions<Client, ApiOptions<{customerId: string}, Customer>>

const noop = () => ({})
const TODO = (method: keyof Client) => {
    throw new NotImplementedError(`Cache logic for '${method}'`)
}

const baseQueryKey = (customerId: string, parameters: CustomerOptions['parameters']) => [
    '/organizations/',
    parameters.organizationId,
    '/customers/',
    customerId
]

/** Invalidates the customer and all derivative endpoints */
const invalidateCustomer = (
    customerId: string,
    parameters: CustomerOptions['parameters']
): CacheUpdate => {
    return {
        invalidate: [
            and(matchesApiConfig(parameters), pathStartsWith(baseQueryKey(customerId, parameters)))
        ]
    }
}

// TODO: Rather than every /customers/{customerId} endpoint whenever we update
// a derivative property (e.g. address), can we instead update the corresponding
// cached query and insert the data into the cached customer query, but leave
// everything else alone?
export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {
    authorizeCustomer: TODO('authorizeCustomer'),
    authorizeTrustedSystem: TODO('authorizeTrustedSystem'),
    createCustomerAddress(customerId, {parameters}, response) {
        if (!customerId) return {}
        return {
            ...invalidateCustomer(customerId, parameters),
            update: [
                {
                    queryKey: [
                        ...baseQueryKey(customerId, parameters),
                        '/addresses',
                        response.addressId,
                        // getCustomerAddress uses `addressName` rather than `addressId`
                        {...parameters, addressName: response.addressId}
                    ]
                }
            ]
        }
    },
    createCustomerPaymentInstrument(customerId, {parameters}, response) {
        if (!customerId) return {}

        return {
            ...invalidateCustomer(customerId, parameters),
            update: [
                {
                    queryKey: [
                        ...baseQueryKey(customerId, parameters),
                        '/payment-instruments/',
                        response.paymentInstrumentId,
                        {parameters, paymentInstrumentId: response.paymentInstrumentId}
                    ]
                }
            ]
        }
    },
    createCustomerProductList(customerId, {parameters}, response) {
        if (!customerId) return {}
        const base = baseQueryKey(customerId, parameters)
        return {
            // We can only update cache if the response comes with an ID
            update: !response.id
                ? []
                : [
                      {
                          queryKey: [
                              ...base,
                              '/product-lists/',
                              response.id,
                              {
                                  ...parameters,
                                  listId: response.id
                              }
                          ]
                      }
                  ],
            // We always invalidate, because even without an ID we assume that something has changed
            invalidate: [
                // TODO: Convert to exact path match
                and(matchesApiConfig(parameters), pathStartsWith([...base, '/product-lists']))
            ]
        }
    },
    createCustomerProductListItem(customerId, {parameters}, response) {
        if (!customerId) return {}
        const base = baseQueryKey(customerId, parameters)
        return {
            // We can only update cache if the response comes with an ID
            update: !response.id
                ? []
                : [
                      {
                          queryKey: [
                              ...base,
                              '/product-lists/',
                              parameters.listId,
                              '/items/',
                              response.id,
                              {
                                  ...parameters,
                                  itemId: response.id
                              }
                          ]
                      }
                  ],
            // We always invalidate, because even without an ID we assume that something has changed
            invalidate: [
                and(
                    matchesApiConfig(parameters),
                    // TODO: Convert to exact path match
                    pathStartsWith([...base, '/product-lists/', parameters.listId])
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
                    pathStartsWith([
                        ...baseQueryKey(customerId, parameters),
                        '/payment-instruments',
                        parameters.paymentInstrumentId
                    ])
                )
            ]
        }
    },
    deleteCustomerProductList: TODO('deleteCustomerProductList'),
    deleteCustomerProductListItem(customerId, {parameters}) {
        if (!customerId) return {}
        const base = baseQueryKey(customerId, parameters)
        return {
            invalidate: [
                and(
                    matchesApiConfig(parameters),
                    pathStartsWith([...base, '/product-lists/', parameters.listId])
                )
            ],
            remove: [
                and(
                    matchesApiConfig(parameters),
                    pathStartsWith([
                        ...base,
                        '/product-lists/',
                        parameters.listId,
                        '/items/',
                        parameters.itemId
                    ])
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
                    pathStartsWith([
                        ...baseQueryKey(customerId, parameters),
                        '/addresses',
                        parameters.addressName
                    ])
                )
            ]
        }
    },
    resetPassword: TODO('resetPassword'),
    updateCustomer(customerId, {parameters}) {
        if (!customerId) return {}
        const base = baseQueryKey(customerId, parameters)
        const update: CacheUpdateUpdate<unknown>[] = [
            {
                queryKey: [...base, parameters]
            }
        ]
        // TODO: Can we just use invalidateCustomer() here, since it invalidates all child paths?
        const invalidate = [
            and(matchesApiConfig(parameters), pathStartsWith([...base, '/payment-instruments'])),
            and(matchesApiConfig(parameters), pathStartsWith([...base, '/addresses'])),
            and(
                matchesApiConfig(parameters),
                pathStartsWith([
                    '/organizations/',
                    parameters.organizationId,
                    '/customers/external-profile'
                ])
            )
        ]
        return {update, invalidate}
    },
    updateCustomerAddress(customerId, {parameters}) {
        if (!customerId) return {}
        // TODO: Can this `invalidate` instead be an update that targets the appropriate property?
        return {
            ...invalidateCustomer(customerId, parameters),
            update: [
                {
                    queryKey: [
                        ...baseQueryKey(customerId, parameters),
                        '/addresses',
                        parameters.addressName,
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
        const base = baseQueryKey(customerId, parameters)
        return {
            update: [
                {
                    queryKey: [
                        ...base,
                        '/product-lists/',
                        parameters.listId,
                        '/items/',
                        parameters.itemId,
                        parameters
                    ]
                }
            ],
            invalidate: [
                and(
                    matchesApiConfig(parameters),
                    // TODO: Convert to exact path match
                    pathStartsWith([...base, '/product-lists/', parameters.listId])
                )
            ]
        }
    }
}
