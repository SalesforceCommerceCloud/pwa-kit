/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Argument, NullableParameters} from '../types'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
type Client = ShopperCustomers<{shortCode: string}>
type Params = NullableParameters<Argument<Client['getCustomerBaskets']>>['parameters']
type test = keyof Params
export const getCustomer = ['organizationId', 'customerId', 'siteId'] as const
export const getCustomerAddress = ['organizationId', 'customerId', 'addressName', 'siteId'] as const
export const getCustomerBaskets = ['organizationId', 'customerId', 'siteId'] as const
export const getCustomerOrders = [
    'organizationId',
    'customerId',
    'crossSites',
    'from',
    'until',
    'status',
    'siteId',
    'offset',
    'limit'
] as const
export const getCustomerPaymentInstrument = [
    'organizationId',
    'customerId',
    'paymentInstrumentId',
    'siteId'
] as const
export const getCustomerProductLists = ['organizationId', 'customerId', 'siteId'] as const
export const getCustomerProductList = ['organizationId', 'customerId', 'listId', 'siteId'] as const
export const getCustomerProductListItem = [
    'organizationId',
    'customerId',
    'listId',
    'itemId',
    'siteId'
] as const
export const getPublicProductListsBySearchTerm = [
    'organizationId',
    'email',
    'firstName',
    'lastName',
    'siteId'
] as const
export const getPublicProductList = ['organizationId', 'siteId'] as const
export const getProductListItem = ['organizationId', 'listId', 'itemId', 'siteId'] as const
export const getExternalProfile = ['organizationId', 'listId', 'itemId', 'siteId'] as const

export default {
    getCustomer,
    getCustomerAddress,
    getCustomerBaskets,
    getCustomerOrders,
    getCustomerPaymentInstrument,
    getCustomerProductList,
    getCustomerProductLists,
    getCustomerProductListItem,
    getPublicProductListsBySearchTerm,
    getPublicProductList,
    getProductListItem
}
