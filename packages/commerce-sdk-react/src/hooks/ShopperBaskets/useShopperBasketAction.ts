/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse} from '../types'
import {ShopperBasketActions, ShopperBasketInstance} from './types'

function useShopperBasketAction(
    action: ShopperBasketActions.addCouponToBasket
): ActionResponse<ShopperBasketInstance['addCouponToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addGiftCertificateItemToBasket
): ActionResponse<ShopperBasketInstance['addGiftCertificateItemToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addItemToBasket
): ActionResponse<ShopperBasketInstance['addItemToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addPaymentInstrumentToBasket
): ActionResponse<ShopperBasketInstance['addPaymentInstrumentToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addPriceBooksToBasket
): ActionResponse<ShopperBasketInstance['addPriceBooksToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addTaxesForBasket
): ActionResponse<ShopperBasketInstance['addTaxesForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addTaxesForBasketItem
): ActionResponse<ShopperBasketInstance['addTaxesForBasketItem']>
function useShopperBasketAction(
    action: ShopperBasketActions.createBasket
): ActionResponse<ShopperBasketInstance['createBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.createShipmentForBasket
): ActionResponse<ShopperBasketInstance['createShipmentForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.deleteBasket
): ActionResponse<ShopperBasketInstance['deleteBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.mergeBasket
): ActionResponse<ShopperBasketInstance['mergeBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeCouponFromBasket
): ActionResponse<ShopperBasketInstance['removeCouponFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeGiftCertificateItemFromBasket
): ActionResponse<ShopperBasketInstance['removeGiftCertificateItemFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeItemFromBasket
): ActionResponse<ShopperBasketInstance['removeItemFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removePaymentInstrumentFromBasket
): ActionResponse<ShopperBasketInstance['removePaymentInstrumentFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeShipmentFromBasket
): ActionResponse<ShopperBasketInstance['removeShipmentFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.transferBasket
): ActionResponse<ShopperBasketInstance['transferBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateBasket
): ActionResponse<ShopperBasketInstance['updateBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateBillingAddressForBasket
): ActionResponse<ShopperBasketInstance['updateBillingAddressForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateCustomerForBasket
): ActionResponse<ShopperBasketInstance['updateCustomerForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateGiftCertificateItemInBasket
): ActionResponse<ShopperBasketInstance['updateGiftCertificateItemInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateItemInBasket
): ActionResponse<ShopperBasketInstance['updateItemInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updatePaymentInstrumentInBasket
): ActionResponse<ShopperBasketInstance['updatePaymentInstrumentInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShipmentForBasket
): ActionResponse<ShopperBasketInstance['updateShipmentForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShippingAddressForShipment
): ActionResponse<ShopperBasketInstance['updateShippingAddressForShipment']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShippingMethodForShipment
): ActionResponse<ShopperBasketInstance['updateShippingMethodForShipment']>
function useShopperBasketAction(action: ShopperBasketActions): ActionResponse<() => Promise<any>> {
    return {
        execute: () => Promise.resolve(),
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketAction
