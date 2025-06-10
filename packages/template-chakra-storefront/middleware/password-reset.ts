/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Router, Request, Response, NextFunction} from 'express'
import {validateSlasCallbackToken} from '../utils/slas'
import {emailLink} from '../utils/email'

interface PasswordResetOptions {
    callbackURI?: string
    landingPath?: string
    shortCode: string
    tenantId: string
}

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }

// Handles the reset password callback route. SLAS makes a POST request to this
// endpoint sending the email address and reset password token. Then this endpoint calls
// the sendMagicLinkEmail function to send an email with the reset password magic link.
// https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-password-reset.html#slas-password-reset-flow
const passwordResetMiddleware = (options: PasswordResetOptions = {}) => {
    const {
        callbackURI = '/reset-password-callback',
        landingPath = '/reset-password-landing',
        shortCode,
        tenantId
    } = options
    const router = Router()

    router.post(
        callbackURI,
        asyncHandler(async (req, res) => {
            const slasCallbackToken = req.headers['x-slas-callback-token']

            // This will throw if the token is invalid.
            await validateSlasCallbackToken(slasCallbackToken, shortCode, tenantId)

            // Extract the base URL from the request
            const base = `${req.protocol}://${req.get('host') || ''}`

            // Extract the email_id and token from the request body
            const {email_id, token} = req.body

            // Call the emailLink function to send an email with the magic link using Marketing Cloud
            const emailLinkResponse = await emailLink(
                email_id,
                process.env.MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE || '',
                `${base}${landingPath}?token=${encodeURIComponent(
                    token
                )}&email=${encodeURIComponent(email_id)}`
            )

            // Send the response
            res.send(emailLinkResponse)
        })
    )

    return router
}

export default passwordResetMiddleware
