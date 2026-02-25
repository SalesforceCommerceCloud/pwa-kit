/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const sites = require('./sites.js')
const {parseSettings, validateOtpTokenLength} = require('./utils.js')

module.exports = {
    app: {
        commerceAgent: parseSettings(process.env.COMMERCE_AGENT_SETTINGS) || {
            enabled: 'false',
            askAgentOnSearch: 'false',
            embeddedServiceName: '',
            embeddedServiceEndpoint: '',
            scriptSourceUrl: '',
            scrt2Url: '',
            salesforceOrgId: '',
            commerceOrgId: '',
            siteId: '',
            enableConversationContext: 'false',
            conversationContext: []
        },
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true,
            interpretPlusSignAsSpace: false
        },
        login: {
            // The length of the token for OTP authentication. Used by passwordless login and reset password.
            // If the env var `OTP_TOKEN_LENGTH` is set, it will override the config value. Valid values are 6 or 8. Defaults to: 8
            tokenLength: validateOtpTokenLength(process.env.OTP_TOKEN_LENGTH),
            passwordless: {
                enabled: false,
                mode: 'email',
                landingPath: '/passwordless-login-landing',
                // Captcha provider: 'turnstile' (Cloudflare) or 'recaptcha' (Google). Backend must verify and strip the token before SLAS.
                captchaProvider: process.env.PASSWORDLESS_CAPTCHA_PROVIDER || 'recaptcha',
                // Cloudflare Turnstile (when captchaProvider === 'turnstile')
                turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '0x4AAAAAACfqlP1dhxZPQ1qQ',
                // Google reCAPTCHA v2 invisible (when captchaProvider === 'recaptcha'). Set RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY on server.
                // For local/automated tests: RECAPTCHA_USE_TEST_KEYS=true uses Google's test keys (siteverify always passes). Never use test keys in production.
                recaptchaSiteKey:
                    process.env.RECAPTCHA_USE_TEST_KEYS === 'true'
                        ? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Google reCAPTCHA test site key
                        : process.env.RECAPTCHA_SITE_KEY || ''
            },
            social: {
                enabled: false,
                idps: ['google', 'apple'],
                redirectURI: process.env.SOCIAL_LOGIN_REDIRECT_URI || '/social-callback'
            },
            resetPassword: {
                mode: 'email',
                landingPath: '/reset-password-landing'
            }
        },
        defaultSite: 'RefArchGlobal',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'global'
        },
        sites,
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: '1aeb2563-c605-4edb-9116-59dcc7e8da42',
                organizationId: 'f_ecom_bhbg_stg',
                shortCode: 'sandbox-001',
                siteId: 'RefArchGlobal'
            }
        },
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst',
            isProduction: false
        },
        dataCloudAPI: {
            appSourceId: '7ae070a6-f4ec-4def-a383-d9cacc3f20a1',
            tenantId: 'g82wgnrvm-ywk9dggrrw8mtggy.pc-rnd'
        },
        // Note: this feature is in Developer Preview at this time. To use One Click Checkout,
        // enable the oneClickCheckout flag and configure private SLAS client. For more details, please
        // check https://github.com/SalesforceCommerceCloud/pwa-kit/releases/tag/v3.16.0
        oneClickCheckout: {
            enabled: true
        },
        partialHydrationEnabled: false,
        pages: {
            cart: {
                groupBonusProductsWithQualifyingProduct: true
            }
        },
        storeLocatorEnabled: true,
        multishipEnabled: true,
        googleCloudAPI: {
            apiKey: process.env.GOOGLE_CLOUD_API_KEY
        }
    },
    envBasePath: '/',
    externals: [],
    pageNotFoundURL: '/page-not-found',
    ssrEnabled: true,
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    ssrShared: [
        'static/ico/favicon.ico',
        'static/robots.txt',
        '**/*.js',
        '**/*.js.map',
        '**/*.json'
    ],
    ssrParameters: {
        ssrFunctionNodeVersion: '22.x',
        proxyConfigs: [
            {
                host: 'sandbox-001.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'bhbg_stg.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            }
        ]
    }
}
