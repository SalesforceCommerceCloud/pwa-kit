/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This is the default configuration for this extension.
export default {
    id: '@salesforce/extension-chakra-storefront',
    activeDataEnabled: false,
    commerceAPI: {
        proxyPath: '/mobify/proxy/api',
        parameters: {
            clientId: '<YOUR_CLIENT_ID_HERE>',
            organizationId: '<YOUR_ORGANIZATION_ID_HERE>',
            shortCode: '<YOUR_SHORT_CODE_HERE>',
            siteId: '<YOUR_SITE_ID_HERE>'
        }
    },
    defaultSite: '<YOUR_SITE_ID_HERE>',
    einsteinAPI: {
        host: 'https://api.cquotient.com',
        einsteinId: '<YOUR_EINSTEIN_ID_HERE>',
        siteId: '<YOUR_SITE_ID_HERE>',
        isProduction: false
    },
    enabled: true,
    pages: {},
    siteAliases: {},
    sites: [],
    url: {
        site: 'path',
        locale: 'path',
        showDefaults: true,
        interpretPlusSignAsSpace: false
    }
}
