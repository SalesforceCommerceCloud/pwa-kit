/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, QueryResponse} from '../types'
import {useQuery} from '../useQuery'
import useCommerceApi from '../useCommerceApi'
import {UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperContexts']

/**
 * A hook for `ShopperContexts#getShopperContext`.
 * Gets the shopper's context based on the shopperJWT. ******** This API is currently a work in progress, and not available to use yet. ********
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=getShopperContext} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#getshoppercontext} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useShopperContext = (
    arg: Argument<Client['getShopperContext']>
): UseQueryResult<DataType<Client['getShopperContext']>, Error> => {
    const {shopperContexts: client} = useCommerceApi()
    return useQuery(['shopper-context', arg], () => client.getShopperContext(arg))
}
