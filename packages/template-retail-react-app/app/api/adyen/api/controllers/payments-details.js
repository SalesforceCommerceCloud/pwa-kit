/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createCheckoutResponse} from '@salesforce/retail-react-app/app/api/adyen/utils/createCheckoutResponse.js'
import AdyenCheckoutConfig from '@salesforce/retail-react-app/app/api/adyen/api/controllers/checkout-config'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {v4 as uuidv4} from 'uuid'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'

const errorMessages = {
    PAYMENTS_DETAILS_NOT_SUCCESSFUL: 'payments details call not successful'
}

async function sendPaymentDetails(req, res, next) {
    Logger.info('sendPaymentDetails', 'start')

    try {
        const {data} = req.body

        const checkout = AdyenCheckoutConfig.getInstance()
        const response = await checkout.paymentsDetails(data, {
            idempotencyKey: uuidv4()
        })
        Logger.info('sendPaymentDetails', `resultCode ${response.resultCode}`)
        const checkoutResponse = createCheckoutResponse(response)
        if (checkoutResponse.isFinal && !checkoutResponse.isSuccessful) {
            throw new AdyenError(errorMessages.PAYMENTS_DETAILS_NOT_SUCCESSFUL, 400)
        }
        res.locals.response = checkoutResponse
        next()
    } catch (err) {
        Logger.error('sendPaymentDetails', err.message)
        next(err)
    }
}

export default sendPaymentDetails
