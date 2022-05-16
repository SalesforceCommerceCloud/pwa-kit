/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
exports.template = (
 answers
) => `{
    "name": "template-base",
    "version": "2.0.0-dev.8",
    "license": "See license in LICENSE",
    "private": true,
    "devDependencies": {
        "@loadable/component": "^5.15.0",
        "cross-env": "^5.2.0",
        "cross-fetch": "^3.1.4",
        "pwa-kit-dev": "^2.0.0-dev.8",
        "pwa-kit-react-sdk": "^2.0.0-dev.8",
        "pwa-kit-runtime": "^2.0.0-dev.8",
        "react": "^17.0.2",
        "react-dom": "^17.0.2",
        "react-helmet": "^6.1.0",
        "react-router": "^5.1.2",
        "react-router-dom": "^5.1.2",
        "${answers.templateName}": "^2.0.0-dev.8"
    },
    "scripts": {
        "test": "pwa-kit-dev test",
        "start": "pwa-kit-dev start --inspect",
        "build": "pwa-kit-dev build",
        "push": "npm run build && pwa-kit-dev push",
        "save-credentials": "pwa-kit-dev save-credentials"
    },
    "mobify": {
        "extends": "${answers.templateName}",
        "app": {
            "url": {
                "site": "path",
                "locale": "path",
                "showDefaults": true
            },
            "defaultSite": "RefArchGlobal",
            "siteAliases": {
                "RefArchGlobal": "global"
            },
            "sites": [{
                "id": "RefArchGlobal",
                "l10n": {
                    "supportedCurrencies": ["GBP"],
                    "defaultCurrency": "GBP",
                    "supportedLocales": [
                        {
                            "id": "en-GB",
                            "preferredCurrency": "GBP"
                        }
                    ],
                    "defaultLocale": "en-GB"
                }
            }],
            "commerceAPI": {
                "proxyPath": "/mobify/proxy/api",
                "parameters": {
                    "clientId": "c9c45bfd-0ed3-4aa2-9971-40f88962b836",
                    "organizationId": "f_ecom_zzrf_001",
                    "shortCode": "8o7m175y",
                    "siteId": "RefArchGlobal"
                }
            },
            "einsteinAPI": {
                "proxyPath": "/mobify/proxy/einstein",
                "einsteinId": "1ea06c6e-c936-4324-bcf0-fada93f83bb1",
                "siteId": "aaij-MobileFirst"
            }
        },
        "extends": ["typescript-minimal"],
        "ssrEnabled": true,
        "ssrParameters": {
            "ssrFunctionNodeVersion": "14.x",
            "proxyConfigs": [
                {
                    "host": "kv7kzm78.api.commercecloud.salesforce.com",
                    "path": "api"
                },
                {
                    "host": "zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com",
                    "path": "ocapi"
                },
                {
                    "host": "api.cquotient.com",
                    "path": "einstein"
                }
            ]
        },
        "ssrOnly": [
            "ssr.js",
            "node_modules/**/*.*"
        ],
        "ssrShared": [
            "intentionally-does-not-exist"
        ]
    }
}`

