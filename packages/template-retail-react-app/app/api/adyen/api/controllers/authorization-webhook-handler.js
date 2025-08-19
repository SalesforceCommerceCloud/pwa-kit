/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {OrderApiClient} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/orderApi'
import {NotificationRequestItem} from '@adyen/api-library'
import {ORDER} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'

const messages = {
    AUTH_ERROR: 'Access Denied!',
    AUTH_SUCCESS: '[accepted]',
    DEFAULT_ERROR: 'Technical error!'
}

async function authorizationWebhookHandler(req, res, next) {
    try {
        const notification = res.locals.notification
        const AUTHORISATION = NotificationRequestItem.EventCodeEnum.Authorisation.toString()
        if (notification.eventCode !== AUTHORISATION) {
            return next()
        }
        const orderNo = notification.merchantReference
        const orderApi = new OrderApiClient()
        if (notification.success === NotificationRequestItem.SuccessEnum.True.toString()) {
            Logger.info(
                notification.eventCode,
                `Authorization for order ${orderNo} was successful.`
            )
            await orderApi.updateOrderConfirmationStatus(
                orderNo,
                ORDER.CONFIRMATION_STATUS_CONFIRMED
            )
            await orderApi.updateOrderPaymentStatus(orderNo, ORDER.PAYMENT_STATUS_PAID)
            await orderApi.updateOrderExportStatus(orderNo, ORDER.EXPORT_STATUS_READY)
            await orderApi.updateOrderStatus(orderNo, ORDER.ORDER_STATUS_NEW)
        } else {
            Logger.info(
                notification.eventCode,
                `Authorization for order ${orderNo} was not successful.`
            )
            await orderApi.updateOrderConfirmationStatus(
                orderNo,
                ORDER.CONFIRMATION_STATUS_NOT_CONFIRMED
            )
            await orderApi.updateOrderPaymentStatus(orderNo, ORDER.PAYMENT_STATUS_NOT_PAID)
            await orderApi.updateOrderExportStatus(orderNo, ORDER.EXPORT_STATUS_NOT_EXPORTED)
            await orderApi.updateOrderStatus(orderNo, ORDER.ORDER_STATUS_FAILED)
        }

        res.locals.response = messages.AUTH_SUCCESS
        next()
    } catch (err) {
        next(err)
    }
}

export {authorizationWebhookHandler}
