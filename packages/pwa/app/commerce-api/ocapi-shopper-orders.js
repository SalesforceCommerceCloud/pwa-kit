/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This class allows integration with OCAPI Orders Resource
// https://documentation.b2c.commercecloud.salesforce.com/DOC2/topic/com.demandware.dochelp/OCAPI/current/shop/Resources/Orders.html
// This implementations coverts CAPI requests to OCAPI requests as there are fundamental differences between the APIS
// One major difference is OCAPI uses snake_case and CAPI uses camelCase for this reaso you will see a utility function in here that convert
// from camelCase to snake_case - camelCaseKeysToUnderscore
// createOcapiFetch is another utility function that returns the response from OCAPI in the fromat returned from CAPI
// Another utility function - checkRequiredParameters is used to check if the parameters or body objects necessary for a call are
// present in the request before making it

import {camelCaseKeysToUnderscore, checkRequiredParameters, createOcapiFetch} from './utils'

class OcapiShopperOrders {
    constructor(config) {
        this.fetch = createOcapiFetch(config)
    }

    async createOrder(...args) {
        const required = ['body']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }

        const {body} = args[0]
        return await this.fetch(
            'orders',
            'POST',
            args,
            'createOrder',
            camelCaseKeysToUnderscore(body)
        )
    }

    async getOrder(...args) {
        const required = ['orderNo']
        let requiredParametersError = checkRequiredParameters(args[0], required)
        if (requiredParametersError) {
            return requiredParametersError
        }
        const {orderNo} = args[0].parameters
        return this.fetch(`orders/${orderNo}`, 'GET', args, 'getOrder')
    }
}

export default OcapiShopperOrders
