/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Router} from 'express'
import {validateSlasCallbackToken} from '../utils/slas'
import {sendMagicLinkEmail} from '../utils/email'

interface PasswordlessOptions {
    callbackURI?: string
    landingPath?: string
}

const passwordlessMiddleware = (options: PasswordlessOptions = {}) => {
    const {
        callbackURI = '/passwordless-login-callback',
        landingPath = '/passwordless-login-landing'
    } = options
    const router = Router()

    router.post(callbackURI, (req, res) => {
        const slasCallbackToken = req.headers['x-slas-callback-token']
        const redirectUrl = req.query.redirectUrl

        validateSlasCallbackToken(slasCallbackToken).then(() => {
            sendMagicLinkEmail(
                req,
                res,
                landingPath,
                process.env.MARKETING_CLOUD_PASSWORDLESS_LOGIN_TEMPLATE,
                redirectUrl
            )
        })
    })

    return router
}

export default passwordlessMiddleware
