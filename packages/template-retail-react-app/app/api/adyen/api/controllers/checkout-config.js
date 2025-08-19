/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Client, Config} from '@adyen/api-library'
import {PaymentsApi} from '@adyen/api-library/lib/src/services/checkout/paymentsApi'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'
import {
    ADYEN_LIVE_REGIONS,
    ADYEN_ENVIRONMENT
} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'

const errorMessages = {
    MISSING_LIVE_PREFIX: 'missing live prefix'
}

class AdyenCheckoutConfig {
    constructor(siteId) {
        this.siteId = siteId
    }

    isLiveEnvironment(environment) {
        return Object.values(ADYEN_LIVE_REGIONS).includes(environment)
    }

    createInstance() {
        const adyenConfig = getAdyenConfigForCurrentSite(this.siteId)
        const config = new Config()
        config.apiKey = adyenConfig.apiKey
        const client = new Client({config})

        const isLiveEnvironment = this.isLiveEnvironment(adyenConfig.environment)

        if (isLiveEnvironment) {
            if (!adyenConfig.liveEndpointUrlPrefix) {
                throw new AdyenError(errorMessages.MISSING_LIVE_PREFIX, 400)
            }
            client.setEnvironment(ADYEN_ENVIRONMENT.LIVE, adyenConfig.liveEndpointUrlPrefix)
        } else {
            client.setEnvironment(ADYEN_ENVIRONMENT.TEST)
        }

        return new PaymentsApi(client)
    }

    static getInstance(siteId) {
        if (!this.instance) {
            const adyenCheckoutConfig = new AdyenCheckoutConfig(siteId)
            this.instance = adyenCheckoutConfig.createInstance()
        }
        return this.instance
    }
}

export default AdyenCheckoutConfig
