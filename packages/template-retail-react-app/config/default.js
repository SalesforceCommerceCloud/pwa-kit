/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const sites = require('./sites.js')
const {parseSettings} = require('./utils.js')

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
                clientId: 'da84f620-2f8f-410b-a860-e1d9a07cf7b4',
                organizationId: 'f_ecom_zyoe_005',
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
            appSourceId: '7ae070a6-f4ec-4def-a383-d9cacc3f20a1',
            tenantId: 'g82wgnrvm-ywk9dggrrw8mtggy.pc-rnd'
        },
        partialHydrationEnabled: false,
        pages: {
            cart: {
                groupBonusProductsWithQualifyingProduct: true
            }
        },
        storeLocatorEnabled: true,
        multishipEnabled: true,
        sfPayments: {
            enabled: true,
            sdkUrl: 'https://zyoe-005.unified.demandware.net/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp/v1/sfp.js',
            metadataUrl:
                'https://zyoe-005.unified.demandware.net/on/demandware.static/Sites-Site/-/-/internal/metadata/v1.json'
            // sdkUrl: 'https://ocapi-mon.demandware.net/on/demandware.static/Sites-Site/-/-/internal/jscript/sfp/v1/sfp.js',
            // metadataUrl: 'https://ocapi-mon.demandware.net/on/demandware.static/Sites-Site/-/-/internal/metadata/v1.json'
            //sdkUrl: 'https://zyom-011.unified.demandware.net/on/demandware.static/Sites-RefArch-Site/-/default/v0/sfp/sfp.js',
            //metadataUrl: 'https://zyom-011.unified.demandware.net/on/demandware.static/Sites-Site/-/-/internal/metadata/v1.json'
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
                host: 'zyoe-005.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            }
        ]
    }
}
