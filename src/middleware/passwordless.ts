/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Router, Request, Response, NextFunction} from 'express'
import {validateSlasCallbackToken} from '../utils/slas'
import {emailLink} from '../utils/email'

interface PasswordlessOptions {
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

const passwordlessMiddleware = (options: PasswordlessOptions) => {
    const {
        callbackURI = '/passwordless-login-callback',
        landingPath = '/passwordless-login-landing',
        shortCode = '',
        tenantId = ''
    } = options || {}
    const router = Router()

    router.post(
        callbackURI,
        asyncHandler(async (req, res) => {
            const slasCallbackToken = req.headers['x-slas-callback-token']
            const redirectUrl = req.query.redirectUrl as string

            // This will throw if the token is invalid.
            await validateSlasCallbackToken(slasCallbackToken as string, shortCode, tenantId)

            // Extract the base URL from the request
            const base = `${req.protocol}://${req.get('host') || ''}`

            // Extract the email_id and token from the request body
            const {email_id, token} = req.body

            // Call the emailLink function to send an email with the magic link using Marketing Cloud
            const emailLinkResponse = await emailLink(
                email_id,
                process.env.MARKETING_CLOUD_PASSWORDLESS_LOGIN_TEMPLATE || '',
                `${base}${landingPath}?token=${encodeURIComponent(token)}${
                    redirectUrl ? `&redirect_url=${encodeURIComponent(redirectUrl)}` : ''
                }`
            )

            // Send the response
            res.send(emailLinkResponse)
        })
    )

    return router
}

export default passwordlessMiddleware
