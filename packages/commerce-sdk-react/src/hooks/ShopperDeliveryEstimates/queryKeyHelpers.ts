/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperDeliveryEstimates} from 'commerce-sdk-isomorphic'
import {Argument, ExcludeTail} from '../types'
import {pickValidParams} from '../utils'

// We must use a client with no parameters in order to have required/optional match the API spec.
type Client = ShopperDeliveryEstimates<{shortCode: string}>
type Params<T extends keyof QueryKeys> = Partial<Argument<Client[T]>['parameters']>
export type QueryKeys = {
    getDeliveryEstimates: [
        '/commerce-sdk-react',
        '/organizations/',
        string | undefined,
        '/delivery-estimates',
        Params<'getDeliveryEstimates'>
    ]
}

type QueryKeyHelper<T extends keyof QueryKeys> = {
    path: (params: Params<T>) => ExcludeTail<QueryKeys[T]>
    queryKey: (params: Params<T>) => QueryKeys[T]
}

export const getDeliveryEstimates: QueryKeyHelper<'getDeliveryEstimates'> = {
    path: (params) => [
        '/commerce-sdk-react',
        '/organizations/',
        params?.organizationId,
        '/delivery-estimates'
    ],
    queryKey: (params: Params<'getDeliveryEstimates'>) => {
        return [
            ...getDeliveryEstimates.path(params),
            pickValidParams(params || {}, ShopperDeliveryEstimates.paramKeys.getDeliveryEstimates)
        ]
    }
}
