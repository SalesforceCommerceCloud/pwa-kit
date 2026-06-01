/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DATA_STORE_WINDOW_GLOBAL, CUSTOM_SITE_PREFERENCES_KEY_SUFFIX} from './constants'
import {warnIfMrtDataStoreBootstrapMissing} from './logging-utils'

/**
 * Returns custom site preferences from the client bootstrap payload (`#mobify-data` → `window`).
 *
 * When SSR did not enable MRT Data Store bootstrap (`isMrtDataStoreEnabled` false), **`window.__MRT_DATA_STORE__`**
 * may be **absent**; this returns **`{}`**. In development (not `production` / `test` `NODE_ENV`), each read may log
 * a warning via **`PWAKitLogger`** (`logging-utils.js`, also re-exported from `data-store-utils.js`).
 *
 * **Note:** Not called by the PWA Kit framework or template apps today; intended for customer code.
 *
 * **Client-side behavior:** Constructs the DAL key `{siteId}-custom-site-preferences` to read from
 * `window.__MRT_DATA_STORE__`, matching the server-side storage format.
 *
 * @param {Object} params - Parameters
 * @param {string} params.siteId - Site ID (required to construct DAL key)
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getCustomSitePreferences({siteId}) {
    if (typeof window === 'undefined') {
        return {}
    }

    if (!siteId || typeof siteId !== 'string') {
        return {}
    }

    warnIfMrtDataStoreBootstrapMissing()
    const root = window[DATA_STORE_WINDOW_GLOBAL]

    // Construct DAL key: {siteId}-custom-site-preferences
    const key = `${siteId}${CUSTOM_SITE_PREFERENCES_KEY_SUFFIX}`
    const value = root && typeof root === 'object' && !Array.isArray(root) ? root[key] : undefined

    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
