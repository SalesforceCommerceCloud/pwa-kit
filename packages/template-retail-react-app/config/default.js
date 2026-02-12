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
                landingPath: '/passwordless-login-landing'
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
                clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
                organizationId: 'f_ecom_zzrf_001',
                shortCode: '8o7m175y',
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
        oneClickCheckout: {
            enabled: false
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
        ssrFunctionNodeVersion: '24.x',
        proxyConfigs: [
            {
                host: 'kv7kzm78.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'zzrf-001.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            }
        ]
    }
}
