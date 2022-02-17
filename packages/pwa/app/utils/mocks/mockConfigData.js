/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// In most test cases, you need to have a config for a component/function to run properly
// use this mock config to mock for your function does not care about any values
// in the config, but simply needs a config for it to run
const mockConfig = {
    app: {
        url: {
            locale: 'path',
            site: 'path'
        },
        siteAliases: {
            'site-1': 'uk',
            'site-2': 'us'
        },
        defaultSite: 'site-1',
        sites: [
            {
                id: 'site-1',
                l10n: {
                    defaultLocale: 'en-GB',
                    supportedLocales: [
                        {
                            id: 'en-GB',
                            alias: 'en-uk',
                            preferredCurrency: 'GBP'
                        },
                        {
                            id: 'fr-FR',
                            alias: 'fr',
                            preferredCurrency: 'EUR'
                        }
                    ]
                }
            },
            {
                id: 'site-2',
                l10n: {
                    defaultLocale: 'en-US',
                    supportedLocales: [
                        {
                            id: 'en-US',
                            preferredCurrency: 'USD'
                        }
                    ]
                }
            }
        ]
    }
}
export {mockConfig}
