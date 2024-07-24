/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, ApiMethod, Argument, CacheUpdateGetter, DataType, MergedOptions} from '../types'
import {useMutation} from '../useMutation'
import {UseMutationResult} from '@tanstack/react-query'
import useCommerceApi from '../useCommerceApi'
import {cacheUpdateMatrix} from './cache'

type Client = ApiClients['shopperBaskets']

/**
 * Mutations available for Shopper Baskets.
 * @group ShopperBaskets
 * @category Mutation
 * @enum
 */
export const ShopperBasketsMutations = {
    /**
      * Creates a new basket.

      The created basket is initialized with default values.
      */
    CreateBasket: 'createBasket',
    /**
      * Transfer the previous shopper's basket to the current shopper by updating the basket's owner. No other values change. You must obtain the shopper authorization token via SLAS and you must provide the ‘guest usid‘ in both the ‘/oauth2/login‘ and ‘/oauth2/token‘ calls while fetching the registered user JWT token.

      A success response contains the transferred basket.

      If the current shopper has an active basket, and the `overrideExisting` request parameter is `false`, then the transfer request returns a BasketTransferException (HTTP status 409). You can proceed with one of these options:
      - Keep the current shopper's active basket.
      - Merge the previous and current shoppers' baskets by calling the `baskets/merge` endpoint.
      - Force the transfer by calling the `baskets/transfer` endpoint again, with the parameter `overrideExisting=true`. Forcing the transfer deletes the current shopper's active basket.
   */
    TransferBasket: 'transferBasket',
    /**
     * Merge data from the previous shopper's basket into the current shopper's active basket and delete the previous shopper's basket. This endpoint doesn't merge Personally Identifiable Information (PII). You must obtain the shopper authorization token via SLAS and you must provide the ‘guest usid‘ in both the ‘/oauth2/login‘ and ‘/oauth2/token‘ calls while fetching the registered user JWT token. After the merge, all basket amounts are recalculated and totaled, including lookups for prices, taxes, shipping, and promotions.
     */
    MergeBasket: 'mergeBasket',
    /**
     * Removes a basket.
     */
    DeleteBasket: 'deleteBasket',
    /**
      * Updates a basket. Only the currency of the basket, source code, the custom
      properties of the basket, and the shipping items will be considered.
      */
    UpdateBasket: 'updateBasket',
    /**
     * Sets the billing address of a basket.
     */
    UpdateBillingAddressForBasket: 'updateBillingAddressForBasket',
    /**
     * Adds a coupon to an existing basket.
     */
    AddCouponToBasket: 'addCouponToBasket',
    /**
     * Removes a coupon from the basket.
     */
    RemoveCouponFromBasket: 'removeCouponFromBasket',
    /**
     * Sets customer information for an existing basket.
     */
    UpdateCustomerForBasket: 'updateCustomerForBasket',
    /**
     * Adds a gift certificate item to an existing basket.
     */
    AddGiftCertificateItemToBasket: 'addGiftCertificateItemToBasket',
    /**
     * Deletes a gift certificate item from an existing basket.
     */
    RemoveGiftCertificateItemFromBasket: 'removeGiftCertificateItemFromBasket',
    /**
     * Updates a gift certificate item of an existing basket.
     */
    UpdateGiftCertificateItemInBasket: 'updateGiftCertificateItemInBasket',
    /**
     * Adds new items to a basket.
     */
    AddItemToBasket: 'addItemToBasket',
    /**
     * Removes a product item from the basket.
     */
    RemoveItemFromBasket: 'removeItemFromBasket',
    /**
     * Updates an item in a basket.
     */
    UpdateItemInBasket: 'updateItemInBasket',
    /**
     * Updates multiple items in a basket.
     */
    UpdateItemsInBasket: 'updateItemsInBasket',
    /**
     * This method allows you to apply external taxation data to an existing basket to be able to pass tax rates and optional values for a specific taxable line item. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
     */
    AddTaxesForBasketItem: 'addTaxesForBasketItem',
    /**
     * Adds a payment instrument to a basket.
     */
    AddPaymentInstrumentToBasket: 'addPaymentInstrumentToBasket',
    /**
     * Removes a payment instrument of a basket.
     */
    RemovePaymentInstrumentFromBasket: 'removePaymentInstrumentFromBasket',
    /**
     * Updates payment instrument of an existing basket.
     */
    UpdatePaymentInstrumentInBasket: 'updatePaymentInstrumentInBasket',
    /**
     * This method allows you to put an array of priceBookIds to an existing basket, which will be used for basket calculation.
     */
    AddPriceBooksToBasket: 'addPriceBooksToBasket',
    /**
      * Creates a new shipment for a basket.

      The created shipment is initialized with values provided in the body
      document and can be updated with further data API calls. Considered from
      the body are the following properties if specified:

      - the ID
      - the shipping address
      - the shipping method
      - gift boolean flag
      - gift message
      - custom properties
      */
    CreateShipmentForBasket: 'createShipmentForBasket',
    /**
      * Removes a specified shipment and all associated product, gift certificate,
      shipping, and price adjustment line items from a basket.
      It is not allowed to remove the default shipment.
      */
    RemoveShipmentFromBasket: 'removeShipmentFromBasket',
    /**
      * Updates a shipment for a basket.

      The shipment is initialized with values provided in the body
      document and can be updated with further data API calls. Considered from
      the body are the following properties if specified:
      - the ID
      - the shipping address
      - the shipping method
      - gift boolean flag
      - gift message
      - custom properties
      */
    UpdateShipmentForBasket: 'updateShipmentForBasket',
    /**
     * Sets a shipping address of a specific shipment of a basket.
     */
    UpdateShippingAddressForShipment: 'updateShippingAddressForShipment',
    /**
     * Sets a shipping method to a specific shipment of a basket.
     */
    UpdateShippingMethodForShipment: 'updateShippingMethodForShipment',
    /**
     * This method allows you to apply external taxation data to an existing basket to be able to pass tax rates and optional values for all taxable line items. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
     */
    AddTaxesForBasket: 'addTaxesForBasket'
} as const

/**
 * Type for Shopper Baskets Mutation.
 * @group ShopperBaskets
 * @category Mutation
 */
export type ShopperBasketsMutation =
    (typeof ShopperBasketsMutations)[keyof typeof ShopperBasketsMutations]

/**
 * Mutation hook for Shopper Baskets.
 * @group ShopperBaskets
 * @category Mutation
 */
export function useShopperBasketsMutation<Mutation extends ShopperBasketsMutation>(
    mutation: Mutation
): UseMutationResult<DataType<Client[Mutation]>, unknown, Argument<Client[Mutation]>> {
    const getCacheUpdates = cacheUpdateMatrix[mutation]

    // The `Options` and `Data` types for each mutation are similar, but distinct, and the union
    // type generated from `Client[Mutation]` seems to be too complex for TypeScript to handle.
    // I'm not sure if there's a way to avoid the type assertions in here for the methods that
    // use them. However, I'm fairly confident that they are safe to do, as they seem to be simply
    // re-asserting what we already have.
    const {shopperBaskets: client} = useCommerceApi()
    type Options = Argument<Client[Mutation]>
    type Data = DataType<Client[Mutation]>
    return useMutation({
        client,
        method: (opts: Options) => (client[mutation] as ApiMethod<Options, Data>)(opts),
        getCacheUpdates: getCacheUpdates as CacheUpdateGetter<MergedOptions<Client, Options>, Data>
    })
}
