/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {hmacValidator, NotificationRequest} from '@adyen/api-library'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'

const messages = {
    AUTH_ERROR: 'Access Denied!',
    AUTH_SUCCESS: '[accepted]',
    DEFAULT_ERROR: 'Technical error!'
}

async function handleWebhook(req, res, next) {
    try {
        // handle webhook notification here and update order status using ORDER API from commerce SDK.
        // check eventCode structure and types here: https://docs.adyen.com/development-resources/webhooks/webhook-types/
        // `return next()` if notification is successfully handled.
        // webhookSuccess middleware return correct response for the webhook.
        // throw relevant error if notification is not successfully handled.
        // errorHandler middleware return error response and logs the error.
    } catch (err) {
        return next(err)
    }
}

function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization
        const {siteId} = req.query
        const adyenConfig = getAdyenConfigForCurrentSite(siteId)
        if (!authHeader) {
            throw new AdyenError(messages.AUTH_ERROR, 401)
        }
        const credentialSeparator = ':'
        const authHeaderSeparator = ' '
        const encoding = 'base64'
        const encodedCredentials = authHeader.split(authHeaderSeparator)[1]
        const auth = new Buffer.from(encodedCredentials, encoding)
            .toString()
            .split(credentialSeparator)
        const user = auth[0]
        const pass = auth[1]

        if (user === adyenConfig.webhookUser && pass === adyenConfig.webhookPassword) {
            return next()
        } else {
            throw new AdyenError(messages.AUTH_ERROR, 401)
        }
    } catch (err) {
        Logger.error('authenticate', JSON.stringify(err))
        return next(err)
    }
}

function validateHmac(req, res, next) {
    try {
        const {siteId} = req.query

        const adyenConfig = getAdyenConfigForCurrentSite(siteId)
        if (!adyenConfig?.webhookHmacKey) {
            return next()
        }
        const {notificationItems} = req.body
        const {NotificationRequestItem} = notificationItems[0]
        const HmacValidator = new hmacValidator()
        if (HmacValidator.validateHMAC(NotificationRequestItem, adyenConfig?.webhookHmacKey)) {
            return next()
        } else {
            throw new AdyenError(messages.AUTH_ERROR, 401)
        }
    } catch (err) {
        Logger.error('validateHmac', JSON.stringify(err))
        return next(err)
    }
}

function parseNotification(req, res, next) {
    try {
        const notificationRequest = new NotificationRequest(req.body)
        const notificationRequestItem = (notificationRequest.notificationItems || []).filter(
            (item) => !!item
        )
        if (!notificationRequestItem[0]) {
            return next(
                new AdyenError(
                    'Handling of Adyen notification has failed. No input parameters were provided.',
                    400
                )
            )
        }
        res.locals.notification = notificationRequestItem[0]
        Logger.info('AdyenNotification', JSON.stringify(res.locals.notification))
        return next()
    } catch (err) {
        return next(err)
    }
}

export {authenticate, validateHmac, handleWebhook, parseNotification}
