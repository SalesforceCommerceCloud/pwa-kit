/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ShopperBasketsInstance} from '../types'
import {ShopperBasketActions} from './types'

function useShopperBasketAction(
    action: ShopperBasketActions.addCouponToBasket
): ActionResponse<ShopperBasketsInstance['addCouponToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addGiftCertificateItemToBasket
): ActionResponse<ShopperBasketsInstance['addGiftCertificateItemToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addItemToBasket
): ActionResponse<ShopperBasketsInstance['addItemToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addPaymentInstrumentToBasket
): ActionResponse<ShopperBasketsInstance['addPaymentInstrumentToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addPriceBooksToBasket
): ActionResponse<ShopperBasketsInstance['addPriceBooksToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addTaxesForBasket
): ActionResponse<ShopperBasketsInstance['addTaxesForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addTaxesForBasketItem
): ActionResponse<ShopperBasketsInstance['addTaxesForBasketItem']>
function useShopperBasketAction(
    action: ShopperBasketActions.createBasket
): ActionResponse<ShopperBasketsInstance['createBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.createShipmentForBasket
): ActionResponse<ShopperBasketsInstance['createShipmentForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.deleteBasket
): ActionResponse<ShopperBasketsInstance['deleteBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.mergeBasket
): ActionResponse<ShopperBasketsInstance['mergeBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeCouponFromBasket
): ActionResponse<ShopperBasketsInstance['removeCouponFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeGiftCertificateItemFromBasket
): ActionResponse<ShopperBasketsInstance['removeGiftCertificateItemFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeItemFromBasket
): ActionResponse<ShopperBasketsInstance['removeItemFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removePaymentInstrumentFromBasket
): ActionResponse<ShopperBasketsInstance['removePaymentInstrumentFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeShipmentFromBasket
): ActionResponse<ShopperBasketsInstance['removeShipmentFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.transferBasket
): ActionResponse<ShopperBasketsInstance['transferBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateBasket
): ActionResponse<ShopperBasketsInstance['updateBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateBillingAddressForBasket
): ActionResponse<ShopperBasketsInstance['updateBillingAddressForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateCustomerForBasket
): ActionResponse<ShopperBasketsInstance['updateCustomerForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateGiftCertificateItemInBasket
): ActionResponse<ShopperBasketsInstance['updateGiftCertificateItemInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateItemInBasket
): ActionResponse<ShopperBasketsInstance['updateItemInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updatePaymentInstrumentInBasket
): ActionResponse<ShopperBasketsInstance['updatePaymentInstrumentInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShipmentForBasket
): ActionResponse<ShopperBasketsInstance['updateShipmentForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShippingAddressForShipment
): ActionResponse<ShopperBasketsInstance['updateShippingAddressForShipment']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShippingMethodForShipment
): ActionResponse<ShopperBasketsInstance['updateShippingMethodForShipment']>
function useShopperBasketAction(action: ShopperBasketActions): ActionResponse<() => Promise<any>> {
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined,
    }
}

export default useShopperBasketAction
