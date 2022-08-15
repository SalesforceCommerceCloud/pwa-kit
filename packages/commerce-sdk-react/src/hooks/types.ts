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

export type ApiClientConfigParams = {
    clientId: string
    organizationId: string
    siteId: string
    shortCode: string
}

export interface ApiClients {
    shopperBaskets: ShopperBaskets<ApiClientConfigParams>
    shopperContexts: ShopperContexts<ApiClientConfigParams>
    shopperCustomers: ShopperCustomers<ApiClientConfigParams>
    shopperDiscoverySearch: ShopperDiscoverySearch<ApiClientConfigParams>
    shopperGiftCertificates: ShopperGiftCertificates<ApiClientConfigParams>
    shopperLogin: ShopperLogin<ApiClientConfigParams>
    shopperOrders: ShopperOrders<ApiClientConfigParams>
    shopperProducts: ShopperProducts<ApiClientConfigParams>
    shopperPromotions: ShopperPromotions<ApiClientConfigParams>
    shopperSearch: ShopperSearch<ApiClientConfigParams>
}

/**
 * Object returned by a "query" hook.
 */
export type QueryResponse<T> = {isLoading: boolean; error?: Error; data?: T}

/**
 * Object returned by an "action" hook.
 */
export type ActionResponse<Args extends unknown[], Data> = QueryResponse<Data> & {
    execute: (...args: Args) => void
}

/**
 * Object returned by a SCAPI "action" hook.
 */
export type ScapiActionResponse<Arg, Data, Name extends string> = ActionResponse<[Arg], Data> &
    Record<Name, ActionResponse<[Arg], Data>['execute']>

/**
 * The first argument of a function.
 */
export type Argument<T extends (arg: any) => unknown> = Parameters<T>[0]

/**
 * The data type returned by a commerce-sdk-isomorphic method when the raw response
 * flag is not set.
 */
export type DataType<T extends (arg: any) => Promise<unknown>> = T extends (
    arg: any
) => Promise<Response | infer R>
    ? R
    : never
