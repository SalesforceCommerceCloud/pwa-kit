/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    app: {
        url: {
            locale: 'path',
            site: 'path',
            showDefaults: true
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
                        },
                        {
                            id: 'it-IT',
                            alias: 'it',
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
    }
}
