/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Router} from 'express'
import {validateSlasCallbackToken} from '../utils/slas'
import {sendMagicLinkEmail} from '../utils/email'

interface PasswordResetOptions {
    callbackURI?: string
    landingPath?: string
}

// Handles the reset password callback route. SLAS makes a POST request to this
// endpoint sending the email address and reset password token. Then this endpoint calls
// the sendMagicLinkEmail function to send an email with the reset password magic link.
// https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-password-reset.html#slas-password-reset-flow
const passwordResetMiddleware = (options: PasswordResetOptions = {}) => {
    const {callbackURI = '/reset-password-callback', landingPath = '/reset-password-landing'} =
        options
    const router = Router()

    router.post(callbackURI, (req, res) => {
        const slasCallbackToken = req.headers['x-slas-callback-token']
        validateSlasCallbackToken(slasCallbackToken).then(() => {
            sendMagicLinkEmail(
                req,
                res,
                landingPath,
                process.env.MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE
            )
        })
    })

    return router
}

export default passwordResetMiddleware
