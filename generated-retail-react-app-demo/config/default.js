/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const sites = require('./sites.js')
const {parseSettings} = require('./utils.js')

module.exports = {
    app: {
        // Enable the store locator and shop the store feature.
        storeLocatorEnabled: true,
        // Enable the multi-ship feature.
        multishipEnabled: true,
        // Enable partial hydration capabilities via Island component
        partialHydrationEnabled: false,
        // Commerce shopping agent configuration for embedded messaging service
        // This enables an agentic shopping experience in the application
        // This property accepts either a JSON string or a plain JavaScript object.
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
        // Customize how your 'site' and 'locale' are displayed in the url.
        url: {
            // Determine where the siteRef is located. Valid values include 'path|query_param|none'. Defaults to: 'none'
            site: 'none',
            // Determine where the localeRef is located. Valid values include 'path|query_param|none'. Defaults to: 'none'
            locale: 'none',
            // This boolean value dictates whether or not default site or locale values are shown in the url. Defaults to: false
            showDefaults: false,
            // This boolean value dictates whether the plus sign (+) is interpreted as space for query param string. Defaults to: false
            interpretPlusSignAsSpace: false
        },
        login: {
            passwordless: {
                // Enables or disables passwordless login for the site. Defaults to: false
                enabled: true,
                // The mode for passwordless login. Valid values include 'email|callback'. Defaults to: 'callback'
                mode: 'email',
                // The callback URI, which can be an absolute URL (including third-party URIs) or a relative path set up by the developer.
                // Required when mode is set to 'callback'. If the env var `PASSWORDLESS_LOGIN_CALLBACK_URI` is set, it will override the config value.
                // callbackURI:
                //     process.env.PASSWORDLESS_LOGIN_CALLBACK_URI || '/passwordless-login-callback',
                // The landing path for passwordless login
                landingPath: '/passwordless-login-landing'
            },
            social: {
                // Enables or disables social login for the site. Defaults to: false
                enabled: false,
                // The third-party identity providers supported by your app. The PWA Kit supports Google and Apple by default.
                // Additional IDPs will also need to be added to the IDP_CONFIG in the SocialLogin component.
                idps: ['google', 'apple'],
                // The redirect URI used after a successful social login authentication.
                // This should be a relative path set up by the developer.
                // If the env var `SOCIAL_LOGIN_REDIRECT_URI` is set, it will override the config value.
                redirectURI: process.env.SOCIAL_LOGIN_REDIRECT_URI || '/social-callback'
            },
            resetPassword: {
                // The mode for reset password. Valid values include 'email|callback'. Defaults to: 'callback'
                mode: 'email',
                // The callback URI, which can be an absolute URL (including third-party URIs) or a relative path set up by the developer.
                // Required when mode is set to 'callback'. If the env var `RESET_PASSWORD_CALLBACK_URI` is set, it will override the config value.
                // callbackURI: process.env.RESET_PASSWORD_CALLBACK_URI || '/reset-password-callback',
                // The landing path for reset password
                landingPath: '/reset-password-landing'
            }
        },
        // The default site for your app. This value will be used when a siteRef could not be determined from the url
        defaultSite: 'RefArch',
        // Provide aliases for your sites. These will be used in place of your site id when generating paths throughout the application.
        // siteAliases: {
        //    RefArch: 'us',
        //    RefArchGlobal: 'global'
        // },
        // The sites for your app, which is imported from sites.js
        sites,
        // Commerce api config
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                clientId: 'bb1e8c16-7767-4ed8-bc5d-83efc59a208a',
                // secret: FctBOLiYAMFFJVu4NiuxYYON6pTIcXjsf_4Wtj7zd80
                organizationId: 'f_ecom_zzrf_001',
                shortCode: 'staging-001',
                siteId: 'RefArchGlobal'
            }
        },
        // Einstein api config
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            siteId: 'aaij-MobileFirst',
            // Flag Einstein activities as coming from a production environment.
            // By setting this to true, the Einstein activities generated by the environment will appear
            // in production environment reports
            isProduction: false
        },
        // Datacloud api config
        dataCloudAPI: {
            appSourceId: '7ae070a6-f4ec-4def-a383-d9cacc3f20a1',
            tenantId: 'g82wgnrvm-ywk9dggrrw8mtggy.pc-rnd'
        },
        // Bonus product config
        pages: {
            cart: {
                groupBonusProductsWithQualifyingProduct: true
            }
        },
        // Google Cloud api config
        googleCloudAPI: {
            apiKey: process.env.GOOGLE_CLOUD_API_KEY
        }
    },
    // Experimental: The base path for the app. This is the path that will be prepended to all /mobify routes,
    // callback routes, and Express routes.
    // Setting this to `/` or an empty string will result in the above routes not having a base path.
    envBasePath: '/',
    // This list contains server-side only libraries that you don't want to be compiled by webpack
    externals: [],
    // Page not found url for your app
    pageNotFoundURL: '/page-not-found',
    // Enables or disables building the files necessary for server-side rendering.
    ssrEnabled: true,
    // This list determines which files are available exclusively to the server-side rendering system
    // and are not available through the /mobify/bundle/ path.
    ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
    // This list determines which files are available to the server-side rendering system
    // and available through the /mobify/bundle/ path.
    ssrShared: [
        'static/ico/favicon.ico',
        'static/robots.txt',
        '**/*.js',
        '**/*.js.map',
        '**/*.json'
    ],
    // Additional parameters that configure Express app behavior.
    ssrParameters: {
        ssrFunctionNodeVersion: '22.x',
        proxyConfigs: [
            {
                host: 'staging-001.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'production-sitegenesis-dw.demandware.net',
                path: 'ocapi'
            }
        ]
    }
}
