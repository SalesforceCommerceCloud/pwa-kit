/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'

function appleDomainAssociation(req, res, next) {
    try {
        const adyenConfig = getAdyenConfigForCurrentSite()
        res.setHeader('content-type', 'text/plain')
        Logger.info('AppleDomainAssociation')
        res.send(`${adyenConfig.appleDomainAssociation}\n`)
    } catch (err) {
        return next(err)
    }
}

export {appleDomainAssociation}
