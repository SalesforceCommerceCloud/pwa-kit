/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * Developer note! When updating this file, make sure to also update the
 * ssr.js template files in pwa-kit-create-app.
 *
 * In the pwa-kit-create-app, the templates are found under:
 * - assets/bootstrap/js/overrides/app/ssr.js.hbs
 * - assets/templates/@salesforce/retail-react-app/app/ssr.js.hbs
 */

'use strict'

import path from 'path'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {defaultPwaKitSecurityHeaders} from '@salesforce/pwa-kit-runtime/utils/middleware'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import helmet from 'helmet'

import express from 'express'
import {emailLink} from '@salesforce/retail-react-app/app/utils/marketing-cloud/marketing-cloud-email-link'
import {
    PASSWORDLESS_LOGIN_LANDING_PATH,
    RESET_PASSWORD_LANDING_PATH
} from '@salesforce/retail-react-app/app/constants'
import {
    validateSlasCallbackToken,
    jwksCaching
} from '@salesforce/retail-react-app/app/utils/jwt-utils'

const config = getConfig()

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The contents of the config file for the current environment
    mobify: config,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http',

    // Option for whether to set up a special endpoint for handling
    // private SLAS clients
    // Set this to false if using a SLAS public client
    // When setting this to true, make sure to also set the PWA_KIT_SLAS_CLIENT_SECRET
    // environment variable as this endpoint will return HTTP 501 if it is not set
    useSLASPrivateClient: false,

    // If you wish to use additional SLAS endpoints that require private clients,
    // customize this regex to include the additional endpoints the custom SLAS
    // private client secret handler will inject an Authorization header.
    // The default regex is defined in this file: https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/pwa-kit-runtime/src/ssr/server/build-remote-server.js
    // applySLASPrivateClientToEndpoints:
    //     /\/oauth2\/(token|passwordless\/(login|token)|password\/(reset|action))/,

    // If this is enabled, any HTTP header that has a non ASCII value will be URI encoded
    // If there any HTTP headers that have been encoded, an additional header will be
    // passed, `x-encoded-headers`, containing a comma separated list
    // of the keys of headers that have been encoded
    // There may be a slight performance loss with requests/responses with large number
    // of headers as we loop through all the headers to verify ASCII vs non ASCII
    encodeNonAsciiHttpHeaders: true
}

const runtime = getRuntime()

const resetPasswordCallback =
    config.app.login?.resetPassword?.callbackURI || '/reset-password-callback'
const passwordlessLoginCallback =
    config.app.login?.passwordless?.callbackURI || '/passwordless-login-callback'

// Reusable function to handle sending a magic link email.
// By default, this implementation uses Marketing Cloud.
async function sendMagicLinkEmail(req, res, landingPath, emailTemplate, redirectUrl) {
    // Extract the base URL from the request
    const base = req.protocol + '://' + req.get('host')

    // Extract the email_id and token from the request body
    const {email_id, token} = req.body

    // Construct the magic link URL
    let magicLink = `${base}${landingPath}?token=${encodeURIComponent(token)}`
    if (landingPath === RESET_PASSWORD_LANDING_PATH) {
        // Add email query parameter for reset password flow
        magicLink += `&email=${encodeURIComponent(email_id)}`
    }
    if (landingPath === PASSWORDLESS_LOGIN_LANDING_PATH && redirectUrl) {
        magicLink += `&redirect_url=${encodeURIComponent(redirectUrl)}`
    }

    // Call the emailLink function to send an email with the magic link using Marketing Cloud
    const emailLinkResponse = await emailLink(email_id, emailTemplate, magicLink)

    // Send the response
    res.send(emailLinkResponse)
}

const {handler} = runtime.createHandler(options, (app) => {
    app.use(express.json()) // To parse JSON payloads
    app.use(express.urlencoded({extended: true}))
    // Set default HTTP security headers required by PWA Kit
    app.use(defaultPwaKitSecurityHeaders)
    // Set custom HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'img-src': [
                        // Default source for product images - replace with your CDN
                        '*.commercecloud.salesforce.com'
                    ],
                    'script-src': [
                        // Used by the service worker in /worker/main.js
                        'storage.googleapis.com'
                    ],
                    'connect-src': [
                        // Connect to Einstein APIs
                        'api.cquotient.com'
                    ]
                }
            }
        })
    )

    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        // This endpoint does nothing and is not expected to change
        // Thus we cache it for a year to maximize performance
        res.set('Cache-Control', `max-age=31536000`)
        res.send()
    })

    app.get('/:shortCode/:tenantId/oauth2/jwks', (req, res) => {
        jwksCaching(req, res, {shortCode: req.params.shortCode, tenantId: req.params.tenantId})
    })

    // Handles the passwordless login callback route. SLAS makes a POST request to this
    // endpoint sending the email address and passwordless token. Then this endpoint calls
    // the sendMagicLinkEmail function to send an email with the passwordless login magic link.
    // https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-passwordless-login.html#receive-the-callback
    app.post(passwordlessLoginCallback, (req, res) => {
        const slasCallbackToken = req.headers['x-slas-callback-token']
        const redirectUrl = req.query.redirectUrl
        validateSlasCallbackToken(slasCallbackToken).then(() => {
            sendMagicLinkEmail(
                req,
                res,
                PASSWORDLESS_LOGIN_LANDING_PATH,
                process.env.MARKETING_CLOUD_PASSWORDLESS_LOGIN_TEMPLATE,
                redirectUrl
            )
        })
    })

    // Handles the reset password callback route. SLAS makes a POST request to this
    // endpoint sending the email address and reset password token. Then this endpoint calls
    // the sendMagicLinkEmail function to send an email with the reset password magic link.
    // https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-password-reset.html#slas-password-reset-flow
    app.post(resetPasswordCallback, (req, res) => {
        const slasCallbackToken = req.headers['x-slas-callback-token']
        validateSlasCallbackToken(slasCallbackToken).then(() => {
            sendMagicLinkEmail(
                req,
                res,
                RESET_PASSWORD_LANDING_PATH,
                process.env.MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE
            )
        })
    })

    app.get('/robots.txt', runtime.serveStaticFile('static/robots.txt'))
    app.get('/favicon.ico', runtime.serveStaticFile('static/ico/favicon.ico'))

    app.get('/worker.js(.map)?', runtime.serveServiceWorker)
    app.get('*', runtime.render)
})
// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = handler
