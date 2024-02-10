/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier = BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getBasket = ['organizationId', 'basketId', 'siteId', 'locale'] as const

const getPaymentMethodsForBasket = ['organizationId', 'basketId', 'siteId', 'locale'] as const
const getPriceBooksForBasket = ['organizationId', 'basketId', 'siteId'] as const
const getShippingMethodsForShipment = [
    'organizationId',
    'basketId',
    'shipmentId',
    'siteId',
    'locale'
] as const
const getTaxesFromBasket = ['organizationId', 'basketId', 'siteId'] as const

export default {
    getBasket,
    getPaymentMethodsForBasket,
    getPriceBooksForBasket,
    getShippingMethodsForShipment,
    getTaxesFromBasket
}
