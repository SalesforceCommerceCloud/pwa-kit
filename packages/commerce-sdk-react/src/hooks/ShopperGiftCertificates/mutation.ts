/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, DataType, Argument} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction} from '@tanstack/react-query'

type Client = ApiClients['shopperGiftCertificates']

export const ShopperGiftCertificatesMutations = {
    /**
     * Action to retrieve an existing gift certificate.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-gift-certificates?meta=getGiftCertificate} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppergiftcertificates.shoppergiftcertificates-1.html#getgiftcertificate} for more information on the parameters and returned data type.
     */
    GetGiftCertificate: 'getGiftCertificate'
} as const

type ShopperGiftCertificatesMutationType = typeof ShopperGiftCertificatesMutations[keyof typeof ShopperGiftCertificatesMutations]

/**
 * A hook for performing mutations with the Shopper Gift Certificates API.
 */
export function useShopperGiftCertificatesMutation<
    Action extends ShopperGiftCertificatesMutationType
>(action: Action) {
    type Params = Argument<Client[Action]>
    type Data = DataType<Client[Action]>
    return useMutation<Data, Error, Params>((params, apiClients) => {
        const method = apiClients['shopperGiftCertificates'][action] as MutationFunction<
            Data,
            Params
        >
        return method.call(apiClients['shopperGiftCertificates'], params)
    })
}
