/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {NotImplementedError} from '../utils'

export const ShopperGiftCertificatesMutations = {
    /**
     * WARNING: This method is not implemented.
     *
     * Action to retrieve an existing gift certificate.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-gift-certificates?meta=getGiftCertificate} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppergiftcertificates.shoppergiftcertificates-1.html#getgiftcertificate} for more information on the parameters and returned data type.
     */
    GetGiftCertificate: 'getGiftCertificate'
} as const

/**
 * WARNING: This method is not implemented.
 *
 * A hook for performing mutations with the Shopper Gift Certificates API.
 */
export function useShopperGiftCertificatesMutation() {
    NotImplementedError()
}
