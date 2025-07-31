/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/components/express/utils/api'

export class AdyenPaymentMethodsService {
    baseUrl = '/api/adyen/paymentMethods/standalone'
    apiClient = null

    constructor(token, site) {
        this.apiClient = new ApiClient(this.baseUrl, token, site)
    }

    async _handleResponse(res) {
        if (res.status >= 300) {
            const errorBody = await res.text()
            throw new Error(`Request failed with status ${res.status}: ${errorBody}`)
        }
        return res.json()
    }

    /**
     * Fetch payment methods without requiring a basket
     * This is specifically designed for "Buy Now" flows where we need
     * to show Apple Pay before creating a basket
     */
    async getPaymentMethods() {
        const res = await this.apiClient.get({
            headers: {
                // No basket ID required for this standalone endpoint
            }
        })
        return this._handleResponse(res)
    }
}
