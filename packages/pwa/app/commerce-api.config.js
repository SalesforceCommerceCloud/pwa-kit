/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import pwaKitConfig from '../pwa-kit-config.json'

export const siteIdMap = {
    RefArch: [{hostname: 'pwa-kit.mobifystorefront.com', siteIdAlias: 'us'}],
    RefArchGlobal: [
        {hostname: 'pwa-kit.mobifystorefront.com', siteIdAlias: 'intl'},
        {hostname: 'localhost', siteIdAlias: 'intl'}
    ]
}

/**
 * a function that returns dynamically siteId based on the hostname
 * @param location
 * @returns {string}
 */
const getSiteId = (location) => {
    const {hostname} = location

    return Object.keys(siteIdMap).find((siteId) => {
        return siteIdMap[siteId].find((config) => config.hostname === hostname)
    })
}

const siteId =
    typeof window !== 'undefined'
        ? getSiteId(window.location)
        : pwaKitConfig.multiSite.defaultSiteId
console.log('siteId', siteId)

/**
 * get the siteId alias based on siteId and current location
 * @param siteId
 * @param location
 * @returns {string} - siteIdAlias
 */
const getSiteAlias = (siteId, location) => {
    return siteIdMap[siteId].find((config) => config.hostname === location.hostname)?.[
        'siteIdAlias'
    ]
}

export const siteIdAlias =
    typeof window !== 'undefined'
        ? getSiteAlias(siteId, window.location)
        : pwaKitConfig.multiSite.defaultSiteAlias

export const commerceAPIConfig = {
    proxyPath: `/mobify/proxy/api`,
    parameters: {
        clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
        organizationId: 'f_ecom_zzrf_001',
        shortCode: '8o7m175y',
        siteId
    }
}

console.log('commerceAPIConfig', commerceAPIConfig)
