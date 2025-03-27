/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Application} from 'express'
import express from 'express'
import helmet from 'helmet'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/express'
import {defaultPwaKitSecurityHeaders} from '@salesforce/pwa-kit-runtime/utils/middleware'

// Local Imports
import {Config} from './types'
import extensionMeta from '../extension-meta.json'
import {jwksCachingMiddleware, passwordlessMiddleware, passwordResetMiddleware} from './middleware'
class RetailReactAppExtension extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id
    extendApp(app: Application): Application {
        const config = this.getConfig()
        const {passwordless: passwordlessConfig, resetPassword: resetPasswordConfig} =
            config?.login || {}

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
                            'api.cquotient.com',
                            // Connect to DataCloud APIs
                            '*.c360a.salesforce.com'
                        ]
                    }
                }
            })
        )

        app.use(jwksCachingMiddleware())

        // Apply middleware passwordless.
        app.use(
            passwordlessMiddleware({
                callbackURI: passwordlessConfig?.callbackURI,
                landingPath: passwordlessConfig?.landingPath
            })
        )

        // Apply middleware password reset.
        app.use(
            passwordResetMiddleware({
                callbackURI: resetPasswordConfig?.callbackURI,
                landingPath: resetPasswordConfig?.landingPath
            })
        )

        // Handle the redirect from SLAS as to avoid error
        app.get('/callback?*', (req, res) => {
            // This endpoint does nothing and is not expected to change
            // Thus we cache it for a year to maximize performance
            res.set('Cache-Control', `max-age=31536000`)
            res.send()
        })

        return app
    }
}

export default RetailReactAppExtension
