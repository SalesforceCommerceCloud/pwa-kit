/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import pwaKitConfig from '../pwa-kit-config.json'

const getSiteInfo = (location) => {
    const {hostname} = location
    return pwaKitConfig.app.sites.find((site) => {
        return site.hostname.includes(hostname)
    })
}
// how to deal with SSR?
export const siteInfo =
    typeof window !== 'undefined'
        ? getSiteInfo(window.location)
        : {id: 'RefArchGlobal', alias: 'global'}

export const commerceAPIConfig = {
    proxyPath: `/mobify/proxy/api`,
    parameters: {
        clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
        organizationId: 'f_ecom_zzrf_001',
        shortCode: '8o7m175y',
        siteId: siteInfo.id
    }
}
