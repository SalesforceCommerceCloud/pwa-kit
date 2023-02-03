/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType, ApiMethod} from '../types'
import {useMutation} from '../useMutation'
import {UseMutationResult} from '@tanstack/react-query'
import {NotImplementedError} from '../utils'
import useCommerceApi from '../useCommerceApi'
import {cacheUpdateMatrix} from './config'

type Client = ApiClients['shopperBaskets']

export const ShopperBasketsMutations = {
    CreateBasket: 'createBasket',
    TransferBasket: 'transferBasket',
    MergeBasket: 'mergeBasket',
    DeleteBasket: 'deleteBasket',
    UpdateBasket: 'updateBasket',
    UpdateBillingAddressForBasket: 'updateBillingAddressForBasket',
    AddCouponToBasket: 'addCouponToBasket',
    RemoveCouponFromBasket: 'removeCouponFromBasket',
    UpdateCustomerForBasket: 'updateCustomerForBasket',
    AddGiftCertificateItemToBasket: 'addGiftCertificateItemToBasket',
    RemoveGiftCertificateItemFromBasket: 'removeGiftCertificateItemFromBasket',
    UpdateGiftCertificateItemInBasket: 'updateGiftCertificateItemInBasket',
    AddItemToBasket: 'addItemToBasket',
    RemoveItemFromBasket: 'removeItemFromBasket',
    UpdateItemInBasket: 'updateItemInBasket',
    AddTaxesForBasketItem: 'addTaxesForBasketItem',
    AddPaymentInstrumentToBasket: 'addPaymentInstrumentToBasket',
    RemovePaymentInstrumentFromBasket: 'removePaymentInstrumentFromBasket',
    UpdatePaymentInstrumentInBasket: 'updatePaymentInstrumentInBasket',
    AddPriceBooksToBasket: 'addPriceBooksToBasket',
    CreateShipmentForBasket: 'createShipmentForBasket',
    RemoveShipmentFromBasket: 'removeShipmentFromBasket',
    UpdateShipmentForBasket: 'updateShipmentForBasket',
    UpdateShippingAddressForShipment: 'updateShippingAddressForShipment',
    UpdateShippingMethodForShipment: 'updateShippingMethodForShipment',
    AddTaxesForBasket: 'addTaxesForBasket'
} as const

export type ShopperBasketsMutation = typeof ShopperBasketsMutations[keyof typeof ShopperBasketsMutations]

export function useShopperBasketsMutation<Mutation extends ShopperBasketsMutation>(
    mutation: Mutation
): UseMutationResult<DataType<Client[Mutation]>, unknown, Argument<Client[Mutation]>> {
    const getCacheUpdates = cacheUpdateMatrix[mutation]
    // TODO: Remove this check when all mutations are implemented.
    if (!getCacheUpdates) throw new NotImplementedError(`The '${mutation}' mutation`)

    const {shopperBaskets: client} = useCommerceApi()
    // I think that this type assertion is necessary because there are too many mutation types
    // and they don't sufficiently overlap.
    const method = (arg: Argument<Client[Mutation]>) =>
        (client[mutation] as ApiMethod<Argument<Client[Mutation]>, DataType<Client[Mutation]>>)(arg)

    return useMutation({method, getCacheUpdates})
}
