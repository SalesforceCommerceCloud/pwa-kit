/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const mockConfig = {
    url: {
        locale: 'path',
        site: 'path'
    },
    defaultSite: 'site-1',
    sites: [
        {
            id: 'site-1',
            alias: 'uk',
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
            alias: 'us',
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
export {mockConfig}
