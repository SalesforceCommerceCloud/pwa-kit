/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClient} from '@salesforce/retail-react-app/app/api/adyen/api'

export class AdyenEnvironmentService {
    baseUrl = '/api/adyen/environment'
    apiClient = null

    constructor(token, site) {
        this.apiClient = new ApiClient(this.baseUrl, token, site)
    }

    async fetchEnvironment() {
        const res = await this.apiClient.get()
        if (res.status >= 300) {
            throw new Error(res)
        } else {
            return await res.json()
        }
    }
}
