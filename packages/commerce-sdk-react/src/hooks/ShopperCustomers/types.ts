/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../../types'

interface ShopperCustomerParams extends QueryParams {
    customerId?: string
}

interface ShopperCustomerProductListParams extends ShopperCustomerParams {
    listId?: string
}

interface ShopperCustomerProductListItemParams extends ShopperCustomerParams {
    itemId?: string
}

interface ShopperCustomerPublicProductListParams extends QueryParams {
    email?: string
    firstName?: string
    lastName?: string
}

interface ShopperCustomerPublicProductListItemParams extends QueryParams {
    itemId?: string
}

interface ShopperCustomerPublicProductListParams extends QueryParams {
    listId?: string
}

interface ShopperCustomerExternalProfileParams extends ShopperCustomerParams {
    externalId?: string
    authenticationProviderId?: string
}

interface ShopperCustomerOrdersParams extends ShopperCustomerParams {
    crossSites?: boolean
    from?: string
    until?: string
    status?: string
    offset?: number
    limit?: number
}

interface ShopperCustomerAddressParams extends ShopperCustomerParams {
    addressName?: string
}

interface ShopperCustomerPaymentInstrumentParams extends ShopperCustomerParams {
    paymentInstrumentId?: string
}

enum ShopperCustomerActions {
    registerCustomer = 'registerCustomer',
    invalidateCustomerAuth = 'invalidateCustomerAuth',
    authorizeCustomer = 'authorizeCustomer',
    authorizeTrustedSystem = 'authorizeTrustedSystem',
    resetPassword = 'resetPassword',
    getResetPasswordToken = 'getResetPasswordToken',
    registerExternalProfile = 'registerExternalProfile',
    updateCustomer = 'updateCustomer',
    createCustomerAddress = 'createCustomerAddress',
    removeCustomerAddress = 'removeCustomerAddress',
    updateCustomerAddress = 'updateCustomerAddress',
    updateCustomerPassword = 'updateCustomerPassword',
    createCustomerPaymentInstrument = 'createCustomerPaymentInstrument',
    deleteCustomerPaymentInstrument = 'deleteCustomerPaymentInstrument',
    createCustomerProductList = 'createCustomerProductList',
    deleteCustomerProductList = 'deleteCustomerProductList',
    updateCustomerProductList = 'updateCustomerProductList',
    createCustomerProductListItem = 'createCustomerProductListItem',
    deleteCustomerProductListItem = 'deleteCustomerProductListItem',
    updateCustomerProductListItem = 'updateCustomerProductListItem',
}

export type {
    ShopperCustomerParams,
    ShopperCustomerExternalProfileParams,
    ShopperCustomerAddressParams,
    ShopperCustomerOrdersParams,
    ShopperCustomerPaymentInstrumentParams,
    ShopperCustomerProductListParams,
    ShopperCustomerProductListItemParams,
    ShopperCustomerPublicProductListParams,
    ShopperCustomerPublicProductListItemParams,
    ShopperCustomerActions,
}
