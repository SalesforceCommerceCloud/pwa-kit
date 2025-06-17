/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from './api'

export class AdyenShippingMethodsService {
    baseUrl = '/api/adyen/shipping-methods'
    apiClient = null

    constructor(token, site) {
        this.apiClient = new ApiClient(this.baseUrl, token, site)
    }

    async getShippingMethods(basketId) {
        const res = await this.apiClient.get({
            headers: {
                basketid: basketId
            }
        })
        if (res.status >= 300) {
            throw new Error(res)
        } else {
            return await res.json()
        }
    }

    async updateShippingMethod(shippingMethodId, basketId) {
        const res = await this.apiClient.post({
            body: JSON.stringify({
                shippingMethodId
            }),
            headers: {
                basketid: basketId
            }
        })
        if (res.status >= 300) {
            throw new Error(res)
        } else {
            return await res.json()
        }
    }
}
