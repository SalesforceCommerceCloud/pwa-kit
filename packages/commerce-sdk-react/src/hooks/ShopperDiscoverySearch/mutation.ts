/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, DataType, Argument} from '../types'
import {useMutation} from '../useMutation'
import useCommerceApi from '../useCommerceApi'
import {MutationFunction} from '@tanstack/react-query'

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
 * A hook for performing mutations with the Shopper Discovery Search API.
 */
export function useShopperDiscoverySearchMutation<Action>(action: Action) {
    type Params = NonNullable<Argument<Client[Action]>>['parameters']
    type Data = DataType<Client[Action]>
    const {shopperDiscoverySearch: client} = useCommerceApi()
    const method = client[action] as MutationFunction<Data, Params>
    return useMutation<Data, Error, Params>(method)
}
