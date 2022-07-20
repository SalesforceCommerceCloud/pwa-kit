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

export interface ApiClients<T extends Record<string, unknown>> {
    shopperBaskets: ShopperBaskets<T & ShopperBasketsTypes.ShopperBasketsParameters>
    shopperContexts: ShopperContexts<T & ShopperContextsTypes.ShopperContextsParameters>
    shopperCustomers: ShopperCustomers<T & ShopperCustomersTypes.ShopperCustomersParameters>
    shopperDiscoverySearch: ShopperDiscoverySearch<
        T & ShopperDiscoverySearchTypes.ShopperDiscoverySearchParameters
    >
    shopperGiftCertificates: ShopperGiftCertificates<
        T & ShopperGiftCertificatesTypes.ShopperGiftCertificatesParameters
    >
    shopperLogin: ShopperLogin<T & ShopperLoginTypes.ShopperLoginParameters>
    shopperOrders: ShopperOrders<T & ShopperOrdersTypes.ShopperOrdersParameters>
    shopperProducts: ShopperProducts<T & ShopperProductsTypes.ShopperProductsParameters>
    shopperPromotions: ShopperPromotions<T & ShopperPromotionsTypes.ShopperPromotionsParameters>
    shopperSearch: ShopperSearch<T & ShopperSearchTypes.ShopperSearchParameters>
}

export type ApiClient<T extends Record<string, unknown>> = ApiClients<T>[keyof ApiClients<T>]

// These are the common params for all query hooks
// it allows user to override configs for specific query
export interface QueryParams {
    siteId?: string
    locale?: string
    currency?: string
    organizationId?: string
    shortCode?: string
}

export type QueryResponse<T> =
    | {
          isLoading: boolean
          error?: undefined
          data?: undefined
      }
    | {
          isLoading: true
          error?: Error
          data?: T
      }
    | {
          isLoading: false
          error: Error
          data?: undefined
      }
    | {
          isLoading: false
          error?: undefined
          data: T
      }

// TODO: Include action name as a key in addition to "execute"?
export type ActionResponse<A, R> = QueryResponse<R> & {
    execute: (arg: A) => void
}

export type DependencyList = readonly unknown[]
