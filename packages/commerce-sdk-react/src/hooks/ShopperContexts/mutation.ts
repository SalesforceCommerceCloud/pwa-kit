/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {NotImplementedError} from '../utils'

export const ShopperContextsMutations = {
    /**
     * WARNING: This method is not implemented.
     *
     * Creates the shopper's context based on shopperJWT.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=createShopperContext} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#createshoppercontext} for more information on the parameters and returned data type.
     */
    CreateShopperContext: 'createShopperContext',
    /**
     * WARNING: This method is not implemented.
     *
     * Gets the shopper's context based on the shopperJWT.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=deleteShopperContext} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#deleteshoppercontext} for more information on the parameters and returned data type.
     */
    DeleteShopperContext: 'deleteShopperContext',
    /**
     * WARNING: This method is not implemented.
     *
     * Updates the shopper's context based on the Shopper JWT. If the shopper context exists, it's updated with the patch body. If a customer qualifier or an `effectiveDateTime` is already present in the existing shopper context, its value is replaced by the corresponding value from the patch body. If a customer qualifers' value is set to `null` it's deleted from existing shopper context. If `effectiveDateTime` value is set to set to an empty string (\"\"), it's deleted from existing shopper context. If `effectiveDateTime` value is set to `null` it's ignored. If an `effectiveDateTime` or customer qualifiiers' value is new, it's added to the existing Shopper context.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=updateShopperContext} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#updateshoppercontext} for more information on the parameters and returned data type.
     */
    UpdateShopperContext: 'updateShopperContext'
} as const

/**
 * WARNING: This method is not implemented.
 *
 * A hook for performing mutations with the Shopper Contexts API.
 */
export function useShopperContextsMutation() {
    NotImplementedError()
}
