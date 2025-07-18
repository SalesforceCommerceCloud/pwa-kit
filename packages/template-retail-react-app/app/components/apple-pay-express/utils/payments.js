/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/api'

export class AdyenPaymentsService {
    baseUrl = '/api/adyen/payments'
    apiClient = null

    constructor(token, site) {
        this.apiClient = new ApiClient(this.baseUrl, token, site)
    }

    async submitPayment(adyenStateData, basketId, customerId) {
        const requestBody = {
            data: adyenStateData
        }
        
        const requestHeaders = {
            customerid: customerId,
            basketid: basketId
        }
        
        try {
            const res = await this.apiClient.post({
                body: JSON.stringify(requestBody),
                headers: requestHeaders
            })
            
            if (res.status >= 300) {
                const errorBody = await res.text()
                throw new Error(`Request failed with status ${res.status}: ${errorBody}`)
            } else {
                const responseData = await res.json()
                return responseData
            }
        } catch (error) {
            throw error
        }
    }
}
