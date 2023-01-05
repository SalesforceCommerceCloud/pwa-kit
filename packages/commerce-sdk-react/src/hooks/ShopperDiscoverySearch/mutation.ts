/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {NotImplementedError} from '../utils'

export const ShopperDiscoverySearchMutations = {
    /**
     * WARNING: This method is not implemented.
     *
     * This method retrieves search results for a Channel.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-discovery-search?meta=retrieveResults} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperdiscoverysearch.shopperdiscoverysearch-1.html#retrieveresults} for more information on the parameters and returned data type.
     */
    RetrieveResults: 'retrieveResults'
} as const

/**
 * WARNING: This method is not implemented.
 *
 * A hook for performing mutations with the Shopper Discovery Search API.
 */
export function useShopperDiscoverySearchMutation() {
    NotImplementedError()
}
