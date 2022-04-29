/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This class allows integration with OCAPI Baskets Resource
// https://documentation.b2c.commercecloud.salesforce.com/DOC2/topic/com.demandware.dochelp/OCAPI/current/shop/Resources/Baskets.html
// This implementations coverts CAPI requests to OCAPI requests as there are fundamental differences between the APIS
// One major difference is OCAPI uses snake_case and CAPI uses camelCase for this reaso you will see a utility function in here that convert
// from camelCase to snake_case - camelCaseKeysToUnderscore
// createOcapiFetch is another utility function that returns the response from OCAPI in the fromat returned from CAPI
// Another utility function - checkRequiredParameters is used to check if the parameters or body objects necessary for a call are
// present in the request before making it

import {camelCaseKeysToUnderscore, checkRequiredParameters, createOcapiFetch} from './utils'

class OcapiShopperBaskets {
    constructor(config) {
        this.fetch = createOcapiFetch(config)
    }

    async createBasket(...args) {
        return await this.fetch('baskets', 'POST', args, 'createBasket')
    }

    async updateBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId},
            body
        } = args[0]
        return this.fetch(`baskets/${basketId}`, 'PATCH', args, 'updateBasket', body)
    }

    async getBasket(...args) {
        const required = ['basketId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        const {basketId} = args[0].parameters
        return await this.fetch(`baskets/${basketId}`, 'GET', args, 'getBasket')
    }

    async addItemToBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/items`,
            'POST',
            args,
            'addToBasket',
            camelCaseKeysToUnderscore(body)
        )
    }

    async updateItemInBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId, itemId},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/items/${itemId}`,
            'PATCH',
            args,
            'updateItemInBasket',
            camelCaseKeysToUnderscore(body)
        )
    }

    async removeItemFromBasket(...args) {
        const required = ['basketId', 'itemId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        const {basketId, itemId} = args[0].parameters
        return this.fetch(
            `baskets/${basketId}/items/${itemId}`,
            'DELETE',
            args,
            'removeItemFromBasket'
        )
    }

    async addPaymentInstrumentToBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/payment_instruments`,
            'POST',
            args,
            'addPaymentInstrumentToBasket',
            camelCaseKeysToUnderscore(body)
        )
    }

    async removePaymentInstrumentFromBasket(...args) {
        const required = ['basketId', 'paymentInstrumentId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId, paymentInstrumentId}
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/payment_instruments/${paymentInstrumentId}`,
            'DELETE',
            args,
            'removePaymentInstrumentFromBasket'
        )
    }

    async getPaymentMethodsForBasket(...args) {
        const required = ['basketId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        const {basketId} = args[0].parameters
        return this.fetch(
            `baskets/${basketId}/payment_methods`,
            'GET',
            args,
            'getPaymentMethodsForShipment'
        )
    }

    async getShippingMethodsForShipment(...args) {
        const required = ['basketId', 'shipmentId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        const {basketId, shipmentId} = args[0].parameters
        return this.fetch(
            `baskets/${basketId}/shipments/${shipmentId}/shipping_methods`,
            'GET',
            args,
            'getShippingMethodsForShipment'
        )
    }

    async updateBillingAddressForBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId, useAsShipping = false},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/billing_address?use_as_shipping=${useAsShipping}`,
            'PUT',
            args,
            'updateBillingAddressForBasket',
            camelCaseKeysToUnderscore(body)
        )
    }

    async updateShippingAddressForShipment(...args) {
        const required = ['basketId', 'body', 'shipmentId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId, shipmentId, useAsBilling = false},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/shipments/${shipmentId}/shipping_address?use_as_billing=${useAsBilling}`,
            'PUT',
            args,
            'updateShippingAddressForShipment',
            camelCaseKeysToUnderscore(body)
        )
    }

    async updateShippingMethodForShipment(...args) {
        const required = ['basketId', 'body', 'shipmentId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId, shipmentId},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/shipments/${shipmentId}/shipping_method`,
            'PUT',
            args,
            'updateShippingMethodForShipment',
            camelCaseKeysToUnderscore(body)
        )
    }

    async updateCustomerForBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/customer`,
            'PUT',
            args,
            'updateCustomerForBasket',
            camelCaseKeysToUnderscore(body)
        )
    }

    async deleteBasket(...args) {
        const required = ['basketId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        const {basketId} = args[0].parameters
        return this.fetch(`baskets/${basketId}`, 'DELETE', args, 'deleteBasket')
    }

    async addCouponToBasket(...args) {
        const required = ['basketId', 'body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId},
            body
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/coupons`,
            'POST',
            args,
            'addCouponToBasket',
            camelCaseKeysToUnderscore(body)
        )
    }

    async removeCouponFromBasket(...args) {
        const required = ['basketId', 'couponItemId']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        let {
            parameters: {basketId, couponItemId}
        } = args[0]
        return this.fetch(
            `baskets/${basketId}/coupons/${couponItemId}`,
            'DELETE',
            args,
            'removeCouponFromBasket'
        )
    }
}

export default OcapiShopperBaskets
