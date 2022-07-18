/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../types'

export interface ShopperCustomerParams extends QueryParams {
    customerId?: string
}

export interface ShopperCustomerProductListParams extends ShopperCustomerParams {
    listId?: string
}

export interface ShopperCustomerProductListItemParams extends ShopperCustomerParams {
    itemId?: string
}

export interface ShopperCustomerPublicProductListParams extends QueryParams {
    email?: string
    firstName?: string
    lastName?: string
}

export interface ShopperCustomerPublicProductListItemParams extends QueryParams {
    itemId?: string
}

export interface ShopperCustomerPublicProductListParams extends QueryParams {
    listId?: string
}

export interface ShopperCustomerExternalProfileParams extends ShopperCustomerParams {
    externalId?: string
    authenticationProviderId?: string
}

export interface ShopperCustomerOrdersParams extends ShopperCustomerParams {
    crossSites?: boolean
    from?: string
    until?: string
    status?: string
    offset?: number
    limit?: number
}

export interface ShopperCustomerAddressParams extends ShopperCustomerParams {
    addressName?: string
}

export interface ShopperCustomerPaymentInstrumentParams extends ShopperCustomerParams {
    paymentInstrumentId?: string
}

export enum ShopperCustomerActions {
    // Phase 1

    registerCustomer = 'registerCustomer',
    updateCustomer = 'updateCustomer',
    updateCustomerPassword = 'updateCustomerPassword',
    getResetPasswordToken = 'getResetPasswordToken',
    createCustomerAddress = 'createCustomerAddress',
    removeCustomerAddress = 'removeCustomerAddress',
    updateCustomerAddress = 'updateCustomerAddress',
    createCustomerPaymentInstrument = 'createCustomerPaymentInstrument',
    deleteCustomerPaymentInstrument = 'deleteCustomerPaymentInstrument',
    createCustomerProductList = 'createCustomerProductList',
    createCustomerProductListItem = 'createCustomerProductListItem',
    deleteCustomerProductListItem = 'deleteCustomerProductListItem',
    updateCustomerProductListItem = 'updateCustomerProductListItem',

    // Phase 2
    authorizeCustomer = 'authorizeCustomer',
    invalidateCustomerAuth = 'invalidateCustomerAuth',
    authorizeTrustedSystem = 'authorizeTrustedSystem',
    resetPassword = 'resetPassword',
    registerExternalProfile = 'registerExternalProfile',
    deleteCustomerProductList = 'deleteCustomerProductList',
    updateCustomerProductList = 'updateCustomerProductList'
}
