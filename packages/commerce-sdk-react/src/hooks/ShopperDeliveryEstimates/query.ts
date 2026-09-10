/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryResult} from '@tanstack/react-query'
import {ShopperDeliveryEstimates} from 'commerce-sdk-isomorphic'
import {CLIENT_KEYS} from '../../constant'
import useCommerceApi from '../useCommerceApi'
import {ApiClients, ApiQueryOptions, Argument, DataType, NullableParameters} from '../types'
import {useQuery} from '../useQuery'
import {mergeOptions, omitNullableParameters, pickValidParams} from '../utils'
import * as queryKeyHelpers from './queryKeyHelpers'

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_DELIVERY_ESTIMATES
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

/**
 * Retrieves delivery estimates for products at a destination postal code.
 * @group ShopperDeliveryEstimates
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Delivery Estimates `getDeliveryEstimates` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-delivery-estimates?meta=getDeliveryEstimates | Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperdeliveryestimates.shopperdeliveryestimates-1.html#getdeliveryestimates | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useDeliveryEstimates = (
    apiOptions: NullableParameters<Argument<Client['getDeliveryEstimates']>>,
    queryOptions: ApiQueryOptions<Client['getDeliveryEstimates']> = {}
): UseQueryResult<DataType<Client['getDeliveryEstimates']>> => {
    type Options = Argument<Client['getDeliveryEstimates']>
    type Data = DataType<Client['getDeliveryEstimates']>
    const client = useCommerceApi(CLIENT_KEY)
    const methodName = 'getDeliveryEstimates'
    const requiredParameters = ShopperDeliveryEstimates.paramKeys[`${methodName}Required`]

    const netOptions = omitNullableParameters(mergeOptions(client, apiOptions))
    const parameters = pickValidParams(
        netOptions.parameters,
        ShopperDeliveryEstimates.paramKeys[methodName]
    )
    const queryKey = queryKeyHelpers[methodName].queryKey(netOptions.parameters)
    const method = async (options: Options) => await client[methodName](options)

    queryOptions.meta = {
        displayName: 'useDeliveryEstimates',
        ...queryOptions.meta
    }

    return useQuery<Client, Options, Data>({...netOptions, parameters}, queryOptions, {
        method,
        queryKey,
        requiredParameters
    })
}
