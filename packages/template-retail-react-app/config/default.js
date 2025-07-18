/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sites = require('./sites.js')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {parseCommerceAgentSettings} = require('./utils.js')

module.exports = {
    app: {
        commerceAgent: parseCommerceAgentSettings(process.env.COMMERCE_AGENT_SETTINGS),
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true,
            interpretPlusSignAsSpace: false
        },
        login: {
            passwordless: {
                enabled: false,
                callbackURI:
                    process.env.PASSWORDLESS_LOGIN_CALLBACK_URI || '/passwordless-login-callback',
                landingPath: '/passwordless-login-landing'
            },
            social: {
                enabled: false,
                idps: ['google', 'apple'],
                redirectURI: process.env.SOCIAL_LOGIN_REDIRECT_URI || '/social-callback'
            },
            resetPassword: {
                callbackURI: process.env.RESET_PASSWORD_CALLBACK_URI || '/reset-password-callback',
                landingPath: '/reset-password-landing'
            }
        },
        defaultSite: 'RefArch',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'global'
        },
        sites,
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: 'c2804605-c747-4338-a702-7deeac41540b',
                organizationId: 'f_ecom_zyom_004',
                shortCode: 'sandbox-001',
                siteId: 'RefArch'
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
            appSourceId: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            tenantId: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd'
        }
    },
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
                host: 'zyom-004.unified.demandware.net',
                path: 'ocapi'
            }
        ]
    }
}
