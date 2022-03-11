/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    app: {
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true
        },
        defaultSite: 'RefArchGlobal',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'global'
        },
        sites: [
            {
                id: 'RefArch',
                l10n: {
                    supportedCurrencies: ['USD'],
                    defaultCurrency: 'USD',
                    defaultLocale: 'en-US',
                    supportedLocales: [
                        {
                            id: 'en-US',
                            preferredCurrency: 'USD'
                        },
                        {
                            id: 'en-CA',
                            preferredCurrency: 'USD'
                        }
                    ]
                }
            },
            {
                id: 'RefArchGlobal',
                l10n: {
                    supportedCurrencies: ['GBP', 'EUR', 'CNY', 'JPY'],
                    defaultCurrency: 'GBP',
                    supportedLocales: [
                        {
                            id: 'de-DE',
                            preferredCurrency: 'EUR'
                        },
                        {
                            id: 'en-GB',
                            preferredCurrency: 'GBP'
                        },
                        {
                            id: 'es-MX',
                            preferredCurrency: 'MXN'
                        },
                        {
                            id: 'fr-FR',
                            preferredCurrency: 'EUR'
                        },
                        {
                            id: 'it-IT',
                            preferredCurrency: 'EUR'
                        },
                        {
                            id: 'ja-JP',
                            preferredCurrency: 'JPY'
                        },
                        {
                            id: 'ko-KR',
                            preferredCurrency: 'KRW'
                        },
                        {
                            id: 'pt-BR',
                            preferredCurrency: 'BRL'
                        },
                        {
                            id: 'zh-CN',
                            preferredCurrency: 'CNY'
                        },
                        {
                            id: 'zh-TW',
                            preferredCurrency: 'TWD'
                        }
                    ],
                    defaultLocale: 'en-GB'
                }
            }
        ],
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
            proxyPath: `/mobify/proxy/einstein`,
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst'
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
        ssrFunctionNodeVersion: '14.x',
        proxyConfigs: [
            {
                host: 'kv7kzm78.api.commercecloud.salesforce.com',
                path: 'api'
            },
            {
                host: 'zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
                path: 'ocapi'
            },
            {
                host: 'api.cquotient.com',
                path: 'einstein'
            }
        ]
    }
}
