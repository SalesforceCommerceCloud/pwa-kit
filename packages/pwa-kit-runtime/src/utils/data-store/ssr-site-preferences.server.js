/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {CUSTOM_SITE_PREFERENCES_KEY_SUFFIX} from './constants'
import {getPlainObjectForDataStoreKey} from './data-store-utils'

/**
 * Build the Data Store key for custom site preferences (DAL).
 * @param {string | undefined} siteId - Commerce site id
 * @returns {string | null}
 */
export function buildCustomSitePreferencesDataStoreKey(siteId) {
    if (!siteId || typeof siteId !== 'string') {
        return null
    }
    return `${siteId}${CUSTOM_SITE_PREFERENCES_KEY_SUFFIX}`
}

/**
 * Fetch custom site preferences from the MRT Data Store for SSR (server-only async API).
 * Returns `{}` when the store is unavailable, the key is missing, or site id is unknown.
 *
 * @param {{ siteId?: string }} params
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getCustomSitePreferences({siteId}) {
    const key = buildCustomSitePreferencesDataStoreKey(siteId)
    return getPlainObjectForDataStoreKey({
        dataStoreKey: key,
        logNamespace: 'custom-site-preferences',
        serviceErrorMessage: 'Custom site preferences Data Store request failed'
    })
}
