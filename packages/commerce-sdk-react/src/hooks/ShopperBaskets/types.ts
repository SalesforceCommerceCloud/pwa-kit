/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParams} from '../types'
export interface ShopperBasketParams extends QueryParams {
    basketId?: string
}

// The actions are manually taken from commerce-sdk-isomorphic
export enum ShopperBasketActions {
    // phase 1
    addItemToBasket = 'addItemToBasket',
    removeItemFromBasket = 'removeItemFromBasket',
    updateItemInBasket = 'updateItemInBasket',
    createBasket = 'createBasket',
    mergeBasket = 'mergeBasket',
    updateBasket = 'updateBasket',
    updateBillingAddressForBasket = 'updateBillingAddressForBasket',
    addCouponToBasket = 'addCouponToBasket',
    removeCouponFromBasket = 'removeCouponFromBasket',
    updateCustomerForBasket = 'updateCustomerForBasket',
    addPaymentInstrumentToBasket = 'addPaymentInstrumentToBasket',
    removePaymentInstrumentFromBasket = 'removePaymentInstrumentFromBasket',
    updatePaymentInstrumentInBasket = 'updatePaymentInstrumentInBasket',
    updateShippingAddressForShipment = 'updateShippingAddressForShipment',
    updateShippingMethodForShipment = 'updateShippingMethodForShipment',

    // phase 2
    deleteBasket = 'deleteBasket',
    transferBasket = 'transferBasket',
    addGiftCertificateItemToBasket = 'addGiftCertificateItemToBasket',
    removeGiftCertificateItemFromBasket = 'removeGiftCertificateItemFromBasket',
    updateGiftCertificateItemInBasket = 'updateGiftCertificateItemInBasket',
    addTaxesForBasketItem = 'addTaxesForBasketItem',
    addPriceBooksToBasket = 'addPriceBooksToBasket',
    createShipmentForBasket = 'createShipmentForBasket',
    removeShipmentFromBasket = 'removeShipmentFromBasket',
    updateShipmentForBasket = 'updateShipmentForBasket',
    addTaxesForBasket = 'addTaxesForBasket'
}
