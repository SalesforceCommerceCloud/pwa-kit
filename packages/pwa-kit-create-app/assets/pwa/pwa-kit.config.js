/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
exports.template = () => `{
    "app": {
        "defaultSiteId": "RefArchGlobal",
        "url": {
            "locale": "none",
            "site": "none"
        },
        "sites": [
            {
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
            }
        ]
    }
}
`
