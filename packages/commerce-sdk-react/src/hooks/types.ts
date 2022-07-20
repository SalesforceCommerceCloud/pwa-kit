/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {ShopperContexts} from 'commerce-sdk-isomorphic'
import {ShopperCustomers} from 'commerce-sdk-isomorphic'
import {ShopperDiscoverySearch} from 'commerce-sdk-isomorphic'
import {ShopperGiftCertificates} from 'commerce-sdk-isomorphic'
import {ShopperLogin} from 'commerce-sdk-isomorphic'
import {ShopperOrders} from 'commerce-sdk-isomorphic'
import {ShopperProducts} from 'commerce-sdk-isomorphic'
import {ShopperPromotions} from 'commerce-sdk-isomorphic'
import {ShopperSearch} from 'commerce-sdk-isomorphic'

export * from './ShopperBaskets/types'
export * from './ShopperCustomers/types'
export * from './ShopperOrders/types'
export * from './ShopperProducts/types'
export * from './ShopperPromotions/types'
export * from './ShopperSearch/types'

type CommerceApiProviderParams = {
    clientId: string
    organizationId: string
    shortCode: string
    siteId: string
}

export interface ApiClients {
    shopperBaskets: ShopperBaskets<CommerceApiProviderParams>
    shopperContexts: ShopperContexts<CommerceApiProviderParams>
    shopperCustomers: ShopperCustomers<CommerceApiProviderParams>
    shopperDiscoverySearch: ShopperDiscoverySearch<CommerceApiProviderParams>
    shopperGiftCertificates: ShopperGiftCertificates<CommerceApiProviderParams>
    shopperLogin: ShopperLogin<CommerceApiProviderParams>
    shopperOrders: ShopperOrders<CommerceApiProviderParams>
    shopperProducts: ShopperProducts<CommerceApiProviderParams>
    shopperPromotions: ShopperPromotions<CommerceApiProviderParams>
    shopperSearch: ShopperSearch<CommerceApiProviderParams>
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

export type Argument<T extends (arg: any) => unknown> = T extends (arg: infer R) => any ? R : never

export interface SdkMethod<A, R> {
    (arg: A): Promise<R>
    // Specifying `Response` separately is important so that `R` is just the data type
    (arg: A, flag?: boolean): Promise<Response | R>
}

export type DataType<T extends (...args: any[]) => Promise<any>> = T extends SdkMethod<any, infer R>
    ? R
    : never
