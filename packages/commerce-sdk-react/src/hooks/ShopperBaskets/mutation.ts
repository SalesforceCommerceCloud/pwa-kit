/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction, UseMutationResult, useQueryClient} from '@tanstack/react-query'
import {CacheUpdateMatrixElement, NotImplementedError, updateCache} from '../utils'
import useCustomerId from '../useCustomerId'

type Client = ApiClients['shopperBaskets']

export const ShopperBasketsMutations = {
    /**
     * Creates a new basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=createBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#createbasket} for more information on the parameters and returned data type.
     */
    CreateBasket: 'createBasket',
    /**
     * Transfer the previous shopper's basket to the current shopper by updating the basket's owner. No other values change. You must obtain the shopper authorization token via SLAS, and it must contain both the previous and current shopper IDs.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=mergeBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#mergebasket} for more information on the parameters and returned data type.
     */
    TransferBasket: 'transferBasket',
    /**
     * Merge data from the previous shopper's basket into the current shopper's active basket and delete the previous shopper's basket. This endpoint doesn't merge Personally Identifiable Information (PII). You must obtain the shopper authorization token via SLAS, and it must contain both the previous and current shopper IDs. After the merge, all basket amounts are recalculated and totaled, including lookups for prices, taxes, shipping, and promotions.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=mergeBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#mergebasket} for more information on the parameters and returned data type.
     */
    MergeBasket: 'mergeBasket',
    /**
     * Removes a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=deleteBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#deletebasket} for more information on the parameters and returned data type.
     */
    DeleteBasket: 'deleteBasket',
    /**
     * Updates a basket. Only the currency of the basket, source code, the custom properties of the basket, and the shipping items will be considered.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updatebasket} for more information on the parameters and returned data type.
     */
    UpdateBasket: 'updateBasket',
    /**
     * Sets the billing address of a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateBillingAddressForBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updatebillingaddressforbasket} for more information on the parameters and returned data type.
     */
    UpdateBillingAddressForBasket: 'updateBillingAddressForBasket',
    /**
     * Adds a coupon to an existing basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addCouponToBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#addcoupontobasket} for more information on the parameters and returned data type.
     */
    AddCouponToBasket: 'addCouponToBasket',
    /**
     * Removes a coupon from the basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=removeCouponFromBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#removecouponfrombasket} for more information on the parameters and returned data type.
     */
    RemoveCouponFromBasket: 'removeCouponFromBasket',
    /**
     * Sets customer information for an existing basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateCustomerForBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updatecustomerforbasket} for more information on the parameters and returned data type.
     */
    UpdateCustomerForBasket: 'updateCustomerForBasket',
    /**
     *
     * * WARNING: This method is not implemented.
     *
     * Adds a gift certificate item to an existing basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addGiftCertificateItemToBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#addgiftcertificateitemtobasket} for more information on the parameters and returned data type.
     */
    AddGiftCertificateItemToBasket: 'addGiftCertificateItemToBasket',
    /**
     * Deletes a gift certificate item from an existing basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=removeGiftCertificateItemFromBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#removegiftcertificateitemfrombasket} for more information on the parameters and returned data type.
     */
    RemoveGiftCertificateItemFromBasket: 'removeGiftCertificateItemFromBasket',
    /**
     * Updates a gift certificate item of an existing basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateGiftCertificateItemInBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updategiftcertificateiteminbasket} for more information on the parameters and returned data type.
     */
    UpdateGiftCertificateItemInBasket: 'updateGiftCertificateItemInBasket',
    /**
     * Adds new items to a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addItemToBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#additemtobasket} for more information on the parameters and returned data type.
     */
    AddItemToBasket: 'addItemToBasket',
    /**
     * Removes a product item from the basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=removeItemFromBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#removeitemfrombasket} for more information on the parameters and returned data type.
     */
    RemoveItemFromBasket: 'removeItemFromBasket',
    /**
     * Updates an item in a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateItemInBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updateiteminbasket} for more information on the parameters and returned data type.
     */
    UpdateItemInBasket: 'updateItemInBasket',
    /**
     * This method allows you to apply external taxation data to an existing basket to be able to pass tax rates and optional values for a specific taxable line item. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addTaxesForBasketItem} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#addtaxesforbasketitem} for more information on the parameters and returned data type.
     */
    AddTaxesForBasketItem: 'addTaxesForBasketItem',
    /**
     * Adds a payment instrument to a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addPaymentInstrumentToBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#addpaymentinstrumenttobasket} for more information on the parameters and returned data type.
     */
    AddPaymentInstrumentToBasket: 'addPaymentInstrumentToBasket',
    /**
     * Removes a payment instrument of a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=removePaymentInstrumentFromBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#removepaymentinstrumentfrombasket} for more information on the parameters and returned data type.
     */
    RemovePaymentInstrumentFromBasket: 'removePaymentInstrumentFromBasket',
    /**
     * Updates payment instrument of an existing basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updatePaymentInstrumentInBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updatepaymentinstrumentinbasket} for more information on the parameters and returned data type.
     */
    UpdatePaymentInstrumentInBasket: 'updatePaymentInstrumentInBasket',
    /**
     * This method allows you to put an array of priceBookIds to an existing basket, which will be used for basket calculation.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addPriceBooksToBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#addpricebookstobasket} for more information on the parameters and returned data type.
     */
    AddPriceBooksToBasket: 'addPriceBooksToBasket',
    /**
     * Creates a new shipment for a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=createShipmentForBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#createshipmentforbasket} for more information on the parameters and returned data type.
     */
    CreateShipmentForBasket: 'createShipmentForBasket',
    /**
     * Removes a specified shipment and all associated product, gift certificate, shipping, and price adjustment line items from a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=removeShipmentFromBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#removeshipmentfrombasket} for more information on the parameters and returned data type.
     */
    RemoveShipmentFromBasket: 'removeShipmentFromBasket',
    /**
     * Updates a shipment for a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateShipmentForBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updateshipmentforbasket} for more information on the parameters and returned data type.
     */
    UpdateShipmentForBasket: 'updateShipmentForBasket',
    /**
     * Sets a shipping address of a specific shipment of a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateShippingAddressForShipment} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updateshippingaddressforshipment} for more information on the parameters and returned data type.
     */
    UpdateShippingAddressForShipment: 'updateShippingAddressForShipment',
    /**
     * Sets a shipping method to a specific shipment of a basket.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=updateShippingMethodForShipment} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#updateshippingmethodforshipment} for more information on the parameters and returned data type.
     */
    UpdateShippingMethodForShipment: 'updateShippingMethodForShipment',
    /**
     * This method allows you to apply external taxation data to an existing basket to be able to pass tax rates and optional values for all taxable line items. This endpoint can be called only if external taxation mode was used for basket creation. See POST /baskets for more information.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addTaxesForBasket} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperbaskets.shopperbaskets-1.html#addtaxesforbasket} for more information on the parameters and returned data type.
     */
    AddTaxesForBasket: 'addTaxesForBasket'
} as const

type UseShopperBasketsMutationHeaders = NonNullable<Argument<Client['createBasket']>>['headers']
type UseShopperBasketsMutationArg = {
    headers?: UseShopperBasketsMutationHeaders
    rawResponse?: boolean
    action: ShopperBasketsMutationType
}

type ShopperBasketsClient = ApiClients['shopperBaskets']
export type ShopperBasketsMutationType = typeof ShopperBasketsMutations[keyof typeof ShopperBasketsMutations]

/**
 * @private
 */
export const getCacheUpdateMatrix = (customerId: string | null) => {
    const updateBasketQuery = (basketId?: string) => {
        // TODO: we're missing headers, rawResponse -> not only {basketId}
        const arg = {basketId}
        return basketId
            ? {
                  update: [
                      {
                          name: 'basket',
                          key: ['/baskets', basketId, arg]
                      }
                  ]
              }
            : {}
    }

    const removeBasketQuery = (basketId?: string) => {
        const arg = {basketId}
        return basketId
            ? {
                  remove: [
                      {
                          name: 'basket',
                          key: ['/baskets', basketId, arg]
                      }
                  ]
              }
            : {}
    }

    const invalidateCustomerBasketsQuery = (customerId: string | null) => {
        // TODO: should we use arg here or not? The invalidate method does not need exact query key.
        const arg = {customerId}
        return customerId
            ? {
                  invalidate: [
                      {
                          name: 'customerBaskets',
                          key: ['/customers', customerId, '/baskets', arg]
                      }
                  ]
              }
            : {}
    }

    return {
        addCouponToBasket: (
            params: Argument<Client['addCouponToBasket']>,
            response: DataType<Client['addCouponToBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        addItemToBasket: (
            params: Argument<Client['addItemToBasket']>,
            response: DataType<Client['addItemToBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        removeItemFromBasket: (
            params: Argument<Client['removeItemFromBasket']>,
            response: DataType<Client['removeItemFromBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params?.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        addPaymentInstrumentToBasket: (
            params: Argument<Client['addPaymentInstrumentToBasket']>,
            response: DataType<Client['addPaymentInstrumentToBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        createBasket: (
            params: Argument<Client['createBasket']>,
            response: DataType<Client['createBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = response.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        deleteBasket: (
            params: Argument<Client['deleteBasket']>,
            response: DataType<Client['deleteBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params?.parameters.basketId

            return {
                ...invalidateCustomerBasketsQuery(customerId),
                ...removeBasketQuery(basketId)
            }
        },
        mergeBasket: (
            params: Argument<Client['mergeBasket']>,
            response: DataType<Client['mergeBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = response.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        removeCouponFromBasket: (
            params: Argument<Client['removeCouponFromBasket']>,
            response: DataType<Client['removeCouponFromBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params?.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        removePaymentInstrumentFromBasket: (
            params: Argument<Client['removePaymentInstrumentFromBasket']>,
            response: DataType<Client['removePaymentInstrumentFromBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params?.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updateBasket: (
            params: Argument<Client['updateBasket']>,
            response: DataType<Client['updateBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updateBillingAddressForBasket: (
            params: Argument<Client['updateBillingAddressForBasket']>,
            response: DataType<Client['updateBillingAddressForBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updateCustomerForBasket: (
            params: Argument<Client['updateCustomerForBasket']>,
            response: DataType<Client['updateCustomerForBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updateItemInBasket: (
            params: Argument<Client['updateItemInBasket']>,
            response: DataType<Client['updateItemInBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updatePaymentInstrumentInBasket: (
            params: Argument<Client['updatePaymentInstrumentInBasket']>,
            response: DataType<Client['updatePaymentInstrumentInBasket']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updateShippingAddressForShipment: (
            params: Argument<Client['updateShippingAddressForShipment']>,
            response: DataType<Client['updateShippingAddressForShipment']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        },
        updateShippingMethodForShipment: (
            params: Argument<Client['updateShippingMethodForShipment']>,
            response: DataType<Client['updateShippingMethodForShipment']>
        ): CacheUpdateMatrixElement => {
            const basketId = params.parameters.basketId

            return {
                ...updateBasketQuery(basketId),
                ...invalidateCustomerBasketsQuery(customerId)
            }
        }
    }
}

export const SHOPPER_BASKETS_NOT_IMPLEMENTED = [
    'addGiftCertificateItemToBasket',
    'addPriceBooksToBasket',
    'addTaxesForBasket',
    'addTaxesForBasketItem',
    'createShipmentForBasket',
    'removeGiftCertificateItemFromBasket',
    'removeShipmentFromBasket',
    'transferBasket',
    'updateGiftCertificateItemInBasket',
    'updateShipmentForBasket'
]

/**
 * A hook for performing mutations with the Shopper Baskets API.
 */
export function useShopperBasketsMutation<Action extends ShopperBasketsMutationType>(
    arg: UseShopperBasketsMutationArg
): UseMutationResult<
    DataType<ShopperBasketsClient[Action]> | Response,
    Error,
    Argument<ShopperBasketsClient[Action]>
> {
    const {headers, rawResponse, action} = arg

    type Params = Argument<ShopperBasketsClient[Action]>
    type Data = DataType<ShopperBasketsClient[Action]>

    if (SHOPPER_BASKETS_NOT_IMPLEMENTED.includes(action)) {
        NotImplementedError()
    }
    const queryClient = useQueryClient()
    const customerId = useCustomerId()
    const cacheUpdateMatrix = getCacheUpdateMatrix(customerId)

    return useMutation<Data, Error, Params>(
        (params, apiClients) => {
            const method = apiClients['shopperBaskets'][action] as MutationFunction<Data, Params>
            return (method.call as (
                apiClient: ShopperBasketsClient,
                params: Params,
                rawResponse: boolean | undefined
            ) => any)(apiClients['shopperBaskets'], {...params, headers}, rawResponse)
        },
        {
            onSuccess: (data, params) => {
                updateCache(queryClient, action, cacheUpdateMatrix, data, params)
            }
        }
    )
}
