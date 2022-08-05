/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ApiClients, Argument, DataType} from '../types'
import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperContexts']

export enum ShopperContextsActions {
    /**
     * Creates the shopper's context based on shopperJWT.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=createShopperContext} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#createshoppercontext} for more information on the parameters and returned data type.
     */
    CreateShopperContext = 'createShopperContext',
    /**
     * Gets the shopper's context based on the shopperJWT.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=deleteShopperContext} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#deleteshoppercontext} for more information on the parameters and returned data type.
     */
    DeleteShopperContext = 'deleteShopperContext',
    /**
     * Updates the shopper's context based on the Shopper JWT. If the shopper context exists, it's updated with the patch body. If a customer qualifier or an `effectiveDateTime` is already present in the existing shopper context, its value is replaced by the corresponding value from the patch body. If a customer qualifers' value is set to `null` it's deleted from existing shopper context. If `effectiveDateTime` value is set to set to an empty string (\"\"), it's deleted from existing shopper context. If `effectiveDateTime` value is set to `null` it's ignored. If an `effectiveDateTime` or customer qualifiiers' value is new, it's added to the existing Shopper context.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=updateShopperContext} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#updateshoppercontext} for more information on the parameters and returned data type.
     */
    UpdateShopperContext = 'updateShopperContext'
}

/**
 * A hook for performing actions with the Shopper Contexts API.
 */
export function useShopperContextsAction<Action extends ShopperContextsActions>(
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
    const {shopperContexts: client} = useCommerceApi()
    const method = client[action]
    assertMethod(method)

    return useAsyncCallback((...args: Arg) => method.call(client, args))
}
