/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, CacheUpdateMatrix, DataType} from '../types'

type Client = ApiClients['shopperCustomers']

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {}

type CacheUpdateMatrixElement = any // Tempoary to quiet errors

const noop = () => ({})
// TODO: Convert old matrix to new format
export const shopperCustomersCacheUpdateMatrix = {
    authorizeCustomer: noop,
    authorizeTrustedSystem: noop,
    deleteCustomerProductList: noop,
    getResetPasswordToken: noop,
    invalidateCustomerAuth: noop,
    registerCustomer: noop,
    registerExternalProfile: noop,
    resetPassword: noop,
    updateCustomerPassword: noop,
    updateCustomerProductList: noop,
    updateCustomer: (
        params: Argument<Client['updateCustomer']>,
        response: DataType<Client['updateCustomer']>
    ): CacheUpdateMatrixElement => {
        const {customerId} = params.parameters
        return {
            update: [
                {
                    name: 'customer',
                    key: ['/customers', customerId, {customerId}],
                    updater: () => response
                }
            ],
            invalidate: [
                {
                    name: 'customerPaymentInstrument',
                    key: ['/customers', customerId, '/payment-instruments']
                },
                {name: 'customerAddress', key: ['/customers', customerId, '/addresses']},
                {name: 'externalProfile', key: ['/customers', '/external-profile']}
            ]
        }
    },

    updateCustomerAddress: (
        params: Argument<Client['updateCustomerAddress']>,
        response: DataType<Client['updateCustomerAddress']>
    ): CacheUpdateMatrixElement => {
        const {customerId, addressName} = params.parameters
        return {
            update: [
                {
                    name: 'customerAddress',
                    key: ['/customers', customerId, '/addresses', {addressName, customerId}],
                    updater: () => response
                }
            ],
            invalidate: [{name: 'customer', key: ['/customers', customerId, {customerId}]}]
        }
    },

    createCustomerAddress: (
        params: Argument<Client['createCustomerAddress']>,
        response: DataType<Client['createCustomerAddress']>
    ): CacheUpdateMatrixElement => {
        const {customerId} = params.parameters
        const {addressId} = params.body
        return {
            update: [
                {
                    name: 'customerAddress',
                    key: [
                        '/customers',
                        customerId,
                        '/addresses',
                        {addressName: addressId, customerId}
                    ],
                    updater: () => response
                }
            ],
            invalidate: [{name: 'customer', key: ['/customers', customerId, {customerId}]}]
        }
    },

    removeCustomerAddress: (
        params: Argument<Client['removeCustomerAddress']>,
        response: DataType<Client['removeCustomerAddress']>
    ): CacheUpdateMatrixElement => {
        // TODO: Fix the RequireParametersUnlessAllAreOptional commerce-sdk-isomorphic type assertion
        //  The required parameters become optional accidentally
        // @ts-ignore
        const {customerId, addressName} = params.parameters
        return {
            invalidate: [{name: 'customer', key: ['/customers', customerId, {customerId}]}],
            remove: [
                {
                    name: 'customerAddress',
                    key: ['/customers', customerId, '/addresses', {addressName, customerId}]
                }
            ]
        }
    },

    createCustomerPaymentInstrument: (
        params: Argument<Client['createCustomerPaymentInstrument']>,
        response: DataType<Client['createCustomerPaymentInstrument']>
    ): CacheUpdateMatrixElement => {
        const {customerId} = params.parameters
        return {
            update: [
                {
                    name: 'customerPaymentInstrument',
                    key: [
                        '/customers',
                        customerId,
                        '/payment-instruments',
                        {customerId, paymentInstrumentId: response?.paymentInstrumentId}
                    ],
                    updater: () => response
                }
            ],
            invalidate: [{name: 'customer', key: ['/customers', customerId, {customerId}]}]
        }
    },

    deleteCustomerPaymentInstrument: (
        params: Argument<Client['deleteCustomerPaymentInstrument']>,
        response: DataType<Client['deleteCustomerPaymentInstrument']>
    ): CacheUpdateMatrixElement => {
        // TODO: Fix the RequireParametersUnlessAllAreOptional commerce-sdk-isomorphic type assertion
        //  The required parameters become optional accidentally
        // @ts-ignore
        const {customerId, paymentInstrumentId} = params.parameters
        return {
            invalidate: [{name: 'customer', key: ['/customers', customerId, {customerId}]}],
            remove: [
                {
                    name: 'customerPaymentInstrument',
                    key: [
                        '/customers',
                        customerId,
                        '/payment-instruments',
                        {customerId, paymentInstrumentId}
                    ]
                }
            ]
        }
    },

    createCustomerProductList: (
        params: Argument<Client['createCustomerProductList']>,
        response: DataType<Client['createCustomerProductList']>
    ): CacheUpdateMatrixElement => {
        const {customerId} = params.parameters
        return {
            update: [
                {
                    name: 'customerProductList',
                    key: [
                        '/customers',
                        customerId,
                        '/product-list',
                        {customerId, listId: response?.id}
                    ],
                    updater: () => response
                }
            ]
        }
    },

    createCustomerProductListItem: (
        params: Argument<Client['createCustomerProductListItem']>,
        response: DataType<Client['createCustomerProductListItem']>
    ): CacheUpdateMatrixElement => {
        const {customerId, listId} = params.parameters
        return {
            update: [
                {
                    name: 'customerProductListItem',
                    key: [
                        '/customers',
                        customerId,
                        '/product-list',
                        listId,
                        {itemId: response?.id}
                    ],
                    updater: () => response
                }
            ],
            invalidate: [
                {
                    name: 'customerProductList',
                    key: ['/customers', customerId, '/product-list', {customerId, listId}]
                }
            ]
        }
    },

    updateCustomerProductListItem: (
        params: Argument<Client['updateCustomerProductListItem']>,
        response: DataType<Client['updateCustomerProductListItem']>
    ): CacheUpdateMatrixElement => {
        const {customerId, listId, itemId} = params.parameters
        return {
            update: [
                {
                    name: 'customerProductListItem',
                    key: ['/customers', customerId, '/product-list', listId, {itemId}],
                    updater: () => response
                }
            ],
            invalidate: [
                {
                    name: 'customerProductList',
                    key: ['/customers', customerId, '/product-list', {customerId, listId}]
                }
            ]
        }
    },

    deleteCustomerProductListItem: (
        params: Argument<Client['deleteCustomerProductListItem']>,
        response: DataType<Client['deleteCustomerProductListItem']>
    ): CacheUpdateMatrixElement => {
        // TODO: Fix the RequireParametersUnlessAllAreOptional commerce-sdk-isomorphic type assertion
        //  The required parameters become optional accidentally
        // @ts-ignore
        const {customerId, listId, itemId} = params.parameters
        return {
            invalidate: [
                {
                    name: 'customerProductList',
                    key: ['/customers', customerId, '/product-list', {customerId, listId}]
                }
            ],
            remove: [
                {
                    name: 'customerProductListItem',
                    key: ['/customers', customerId, '/product-list', listId, {itemId}]
                }
            ]
        }
    }
}

export const SHOPPER_CUSTOMERS_NOT_IMPLEMENTED = [
    'authorizeCustomer',
    'authorizeTrustedSystem',
    'deleteCustomerProductList',
    'invalidateCustomerAuth',
    'registerExternalProfile',
    'resetPassword',
    'updateCustomerPassword',
    'updateCustomerProductList'
]
