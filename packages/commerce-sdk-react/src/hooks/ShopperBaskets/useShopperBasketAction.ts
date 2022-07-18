/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type { ShopperBaskets } from 'commerce-sdk-isomorphic'
import {ActionResponse} from '../types'
import {ShopperBasketActions} from './types'

function useShopperBasketAction(
    action: ShopperBasketActions.addCouponToBasket
): ActionResponse<ShopperBaskets<any>['addCouponToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addGiftCertificateItemToBasket
): ActionResponse<ShopperBaskets<any>['addGiftCertificateItemToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addItemToBasket
): ActionResponse<ShopperBaskets<any>['addItemToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addPaymentInstrumentToBasket
): ActionResponse<ShopperBaskets<any>['addPaymentInstrumentToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addPriceBooksToBasket
): ActionResponse<ShopperBaskets<any>['addPriceBooksToBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addTaxesForBasket
): ActionResponse<ShopperBaskets<any>['addTaxesForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.addTaxesForBasketItem
): ActionResponse<ShopperBaskets<any>['addTaxesForBasketItem']>
function useShopperBasketAction(
    action: ShopperBasketActions.createBasket
): ActionResponse<ShopperBaskets<any>['createBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.createShipmentForBasket
): ActionResponse<ShopperBaskets<any>['createShipmentForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.deleteBasket
): ActionResponse<ShopperBaskets<any>['deleteBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.mergeBasket
): ActionResponse<ShopperBaskets<any>['mergeBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeCouponFromBasket
): ActionResponse<ShopperBaskets<any>['removeCouponFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeGiftCertificateItemFromBasket
): ActionResponse<ShopperBaskets<any>['removeGiftCertificateItemFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeItemFromBasket
): ActionResponse<ShopperBaskets<any>['removeItemFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removePaymentInstrumentFromBasket
): ActionResponse<ShopperBaskets<any>['removePaymentInstrumentFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.removeShipmentFromBasket
): ActionResponse<ShopperBaskets<any>['removeShipmentFromBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.transferBasket
): ActionResponse<ShopperBaskets<any>['transferBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateBasket
): ActionResponse<ShopperBaskets<any>['updateBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateBillingAddressForBasket
): ActionResponse<ShopperBaskets<any>['updateBillingAddressForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateCustomerForBasket
): ActionResponse<ShopperBaskets<any>['updateCustomerForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateGiftCertificateItemInBasket
): ActionResponse<ShopperBaskets<any>['updateGiftCertificateItemInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateItemInBasket
): ActionResponse<ShopperBaskets<any>['updateItemInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updatePaymentInstrumentInBasket
): ActionResponse<ShopperBaskets<any>['updatePaymentInstrumentInBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShipmentForBasket
): ActionResponse<ShopperBaskets<any>['updateShipmentForBasket']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShippingAddressForShipment
): ActionResponse<ShopperBaskets<any>['updateShippingAddressForShipment']>
function useShopperBasketAction(
    action: ShopperBasketActions.updateShippingMethodForShipment
): ActionResponse<ShopperBaskets<any>['updateShippingMethodForShipment']>
function useShopperBasketAction(action: ShopperBasketActions): ActionResponse<() => Promise<any>> {
    // @ts-ignore TODO: how to declare the type for dynamic key name [action]?
    return {
        [action]: () => Promise.resolve(),
        isLoading: true,
        error: undefined
    }
}

export default useShopperBasketAction
