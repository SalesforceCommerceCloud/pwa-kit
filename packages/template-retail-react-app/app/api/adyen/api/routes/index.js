/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {query} from 'express-validator'
import bodyParser from 'body-parser'
import EnvironmentController from '@salesforce/retail-react-app/app/api/adyen/api/controllers/environment'
import PaymentMethodsController from '@salesforce/retail-react-app/app/api/adyen/api/controllers/payment-methods'
import PaymentsDetailsController from '@salesforce/retail-react-app/app/api/adyen/api/controllers/payments-details'
import PaymentsController from '@salesforce/retail-react-app/app/api/adyen/api/controllers/payments'
import ShippingAddressController from '@salesforce/retail-react-app/app/api/adyen/api/controllers/shipping-address'
import ShippingMethodsController from '@salesforce/retail-react-app/app/api/adyen/api/controllers/shipping-methods'
import {
    authenticate,
    parseNotification,
    validateHmac
} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/webhook'
import {authorizationWebhookHandler} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/authorization-webhook-handler'
import {createErrorResponse} from '@salesforce/retail-react-app/app/api/adyen/utils/createErrorResponse.js'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {appleDomainAssociation} from '@salesforce/retail-react-app/app/api/adyen/api/controllers/apple-domain-association'

function SuccessHandler(req, res) {
    Logger.info('Success')
    return res.status(200).json(res.locals.response)
}

function ErrorHandler(err, req, res, next) {
    Logger.error(err.message, err.cause)
    return res.status(err.statusCode || 500).json(createErrorResponse(err.message))
}

function registerAdyenEndpoints(app, runtime, overrides) {
    app.use(bodyParser.json())
    app.set('trust proxy', true)

    const environmentHandler = overrides?.environment || [EnvironmentController, SuccessHandler]
    const paymentMethodsHandler = overrides?.paymentMethods || [
        PaymentMethodsController,
        SuccessHandler
    ]
    const paymentsDetailsHandler = overrides?.paymentsDetails || [
        PaymentsDetailsController,
        SuccessHandler
    ]
    const paymentsHandler = overrides?.payments || [PaymentsController, SuccessHandler]
    const webhookHandler = overrides?.webhook || [
        authenticate,
        validateHmac,
        parseNotification,
        authorizationWebhookHandler,
        SuccessHandler
    ]
    const shippingMethodsPostHandler = overrides?.setShippingMethods || [
        ShippingMethodsController.setShippingMethod,
        SuccessHandler
    ]
    const shippingMethodsGetHandler = overrides?.getShippingMethods || [
        ShippingMethodsController.getShippingMethods,
        SuccessHandler
    ]
    const shippingAddressHandler = overrides?.shippingAddress || [
        ShippingAddressController,
        SuccessHandler
    ]
    const appleDomainAssociationHandler = overrides?.appleDomainAssociation || [
        appleDomainAssociation
    ]

    app.get(
        '*/checkout/redirect',
        query('redirectResult').optional().escape(),
        query('amazonCheckoutSessionId').optional().escape(),
        runtime.render
    )
    app.get(
        '*/checkout/confirmation/:orderNo',
        query('adyenAction').optional().escape(),
        runtime.render
    )
    app.get('/api/adyen/environment', ...environmentHandler)
    app.get('/api/adyen/paymentMethods', ...paymentMethodsHandler)
    app.get('/api/adyen/shipping-methods', ...shippingMethodsGetHandler)
    app.get(
        '/.well-known/apple-developer-merchantid-domain-association',
        ...appleDomainAssociationHandler
    )

    app.post('/api/adyen/payments/details', ...paymentsDetailsHandler)
    app.post('/api/adyen/payments', ...paymentsHandler)
    app.post('/api/adyen/webhook', ...webhookHandler)
    app.post('/api/adyen/shipping-methods', ...shippingMethodsPostHandler)
    app.post('/api/adyen/shipping-address', ...shippingAddressHandler)

    app.use(overrides?.ErrorHandler || ErrorHandler)
}

export {registerAdyenEndpoints, SuccessHandler, ErrorHandler}
