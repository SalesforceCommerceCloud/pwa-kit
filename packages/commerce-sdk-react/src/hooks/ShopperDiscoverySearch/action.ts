/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ApiClients, Argument, DataType} from '../types'
import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperDiscoverySearch']

export enum ShopperDiscoverySearchActions {
    /**
     * This method retrieves search results for a Channel.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-discovery-search?meta=retrieveResults} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperdiscoverysearch.shopperdiscoverysearch-1.html#retrieveresults} for more information on the parameters and returned data type.
     */
    RetrieveResults = 'retrieveResults'
}

/**
 * A hook for performing actions with the Shopper Discovery Search API.
 */
export function useShopperDiscoverySearchAction<Action extends ShopperDiscoverySearchActions>(
    action: Action
): ActionResponse<Parameters<Client[Action]>, DataType<Client[Action]>> {
    type Arg = Parameters<Client[Action]>
    type Data = DataType<Client[Action]>
    // Directly calling `client[action](arg)` doesn't work, because the methods don't fully
    // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
    // confident, though, that it is safe, because it seems like we're mostly re-defining what we
    // already have.
    // In addition to the assertion required to get this to work, I have also simplified the
    // overloaded SDK method to a single signature that just returns the data type. This makes it
    // easier to work with when passing to other mapped types.
    function assertMethod(fn: unknown): asserts fn is (arg: Arg) => Promise<Data> {
        if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
    }
    const {shopperDiscoverySearch: client} = useCommerceApi()
    const method = client[action]
    assertMethod(method)

    return useAsyncCallback((...args: Arg) => method.call(client, args))
}
