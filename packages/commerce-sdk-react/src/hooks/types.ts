/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export * from './ShopperBaskets/types'
export * from './ShopperCustomers/types'
export * from './ShopperOrders/types'
export * from './ShopperProducts/types'
export * from './ShopperPromotions/types'
export * from './ShopperSearch/types'

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
