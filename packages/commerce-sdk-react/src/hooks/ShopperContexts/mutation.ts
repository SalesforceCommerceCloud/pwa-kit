/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients} from '../types'
import {createUseMutation, MethodsOf} from '../createUseMutation'
import {cacheUpdateMatrix} from './cache'

/**
 * Mutation for Shopper Contexts.
 * @group ShopperContexts
 * @category Mutation
 * @enum
 */
export const ShopperContextsMutations = {
    /**
     * Creates the shopper's context based on shopperJWT.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Contexts `createShopperContext` endpoint.
     */
    CreateShopperContext: 'createShopperContext',
    /**
     * Gets the shopper's context based on the shopperJWT.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Contexts `deleteShopperContext` endpoint.
     */
    DeleteShopperContext: 'deleteShopperContext',
    /**
     * Updates the shopper's context based on the Shopper JWT. If the shopper context exists, it's updated with the patch body. If a customer qualifier or an `effectiveDateTime` is already present in the existing shopper context, its value is replaced by the corresponding value from the patch body. If a customer qualifers' value is set to `null` it's deleted from existing shopper context. If `effectiveDateTime` value is set to set to an empty string (\"\"), it's deleted from existing shopper context. If `effectiveDateTime` value is set to `null` it's ignored. If an `effectiveDateTime` or customer qualifiiers' value is new, it's added to the existing Shopper context.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Contexts `updateShopperContext` endpoint.
     */
    UpdateShopperContext: 'updateShopperContext'
} as const

/**
 * Mutation for Shopper Contexts.
 * @group ShopperContexts
 * @category Mutation
 */
export type ShopperContextsMutation = MethodsOf<ApiClients['shopperContexts']>

/**
 * Mutation hook for Shopper Contexts.
 * @group ShopperContexts
 * @category Mutation
 */
export const useShopperContextsMutation = createUseMutation<
    'shopperContexts',
    ShopperContextsMutation
>({
    clientKey: 'shopperContexts',
    getCacheUpdates: (mutation) => cacheUpdateMatrix[mutation]
})
