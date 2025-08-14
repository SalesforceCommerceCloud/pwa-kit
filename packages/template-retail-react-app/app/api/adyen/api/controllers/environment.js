/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'

async function getEnvironment(req, res, next) {
    const adyenConfig = getAdyenConfigForCurrentSite(req.query.siteId)
    res.locals.response = {
        ADYEN_CLIENT_KEY: adyenConfig.clientKey,
        ADYEN_ENVIRONMENT: adyenConfig.environment
    }
    next()
}

export default getEnvironment
