/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBaskets, ShopperBasketsTypes} from 'commerce-sdk-isomorphic'
import {ShopperContexts, ShopperContextsTypes} from 'commerce-sdk-isomorphic'
import {ShopperCustomers, ShopperCustomersTypes} from 'commerce-sdk-isomorphic'
import {ShopperDiscoverySearch, ShopperDiscoverySearchTypes} from 'commerce-sdk-isomorphic'
import {ShopperGiftCertificates, ShopperGiftCertificatesTypes} from 'commerce-sdk-isomorphic'
import {ShopperLogin, ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {ShopperOrders, ShopperOrdersTypes} from 'commerce-sdk-isomorphic'
import {ShopperProducts, ShopperProductsTypes} from 'commerce-sdk-isomorphic'
import {ShopperPromotions, ShopperPromotionsTypes} from 'commerce-sdk-isomorphic'
import {ShopperSearch, ShopperSearchTypes} from 'commerce-sdk-isomorphic'

export * from './ShopperBaskets/types'
export * from './ShopperCustomers/types'
export * from './ShopperOrders/types'
export * from './ShopperProducts/types'
export * from './ShopperPromotions/types'
export * from './ShopperSearch/types'

export type ShopperBasketsInstance = ShopperBaskets<
    ShopperBasketsTypes.ShopperBasketsParameters & Record<string, unknown>
>
export type ShopperContextsInstance = ShopperContexts<
    ShopperContextsTypes.ShopperContextsParameters & Record<string, unknown>
>
export type ShopperCustomersInstance = ShopperCustomers<
    ShopperCustomersTypes.ShopperCustomersParameters & Record<string, unknown>
>
export type ShopperDiscoverySearchInstance = ShopperDiscoverySearch<
    ShopperDiscoverySearchTypes.ShopperDiscoverySearchParameters & Record<string, unknown>
>
export type ShopperGiftCertificatesInstance = ShopperGiftCertificates<
    ShopperGiftCertificatesTypes.ShopperGiftCertificatesParameters & Record<string, unknown>
>
export type ShopperLoginInstance = ShopperLogin<
    ShopperLoginTypes.ShopperLoginParameters & Record<string, unknown>
>
export type ShopperOrdersInstance = ShopperOrders<
    ShopperOrdersTypes.ShopperOrdersParameters & Record<string, unknown>
>
export type ShopperProductsInstance = ShopperProducts<
    ShopperProductsTypes.ShopperProductsParameters & Record<string, unknown>
>
export type ShopperPromotionsInstance = ShopperPromotions<
    ShopperPromotionsTypes.ShopperPromotionsParameters & Record<string, unknown>
>
export type ShopperSearchInstance = ShopperSearch<
    ShopperSearchTypes.ShopperSearchParameters & Record<string, unknown>
>

export interface ApiClients {
    shopperBaskets: ShopperBaskets<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperContexts: ShopperContexts<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperCustomers: ShopperCustomers<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperDiscoverySearch: ShopperDiscoverySearch<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperGiftCertificates: ShopperGiftCertificates<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperLogin: ShopperLogin<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperOrders: ShopperOrders<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperProducts: ShopperProducts<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperPromotions: ShopperPromotions<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
    shopperSearch: ShopperSearch<{
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }>
}

export interface CommonHookResponse {
    error: Error | undefined
    isLoading: boolean
}

// These are the common params for all query hooks
// it allows user to override configs for specific query
export interface QueryParams {
    siteId?: string
    locale?: string
    currency?: string
    organizationId?: string
    shortCode?: string
}

export interface QueryResponse<T> extends CommonHookResponse {
    data: T
}

export interface ActionResponse<T> extends CommonHookResponse {
    // TODO: let's use the actual action name instead of "execute"
    execute: T
}

export type DependencyList = readonly any[]
