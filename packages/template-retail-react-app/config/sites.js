/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Provide the sites for your app. Each site includes site id, and its localization configuration.
// You can also provide alias for your locale. They will be used in place of your locale id when generating paths across the app
module.exports = [
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
]
