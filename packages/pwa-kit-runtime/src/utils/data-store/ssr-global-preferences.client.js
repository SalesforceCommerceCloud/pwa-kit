/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DATA_STORE_WINDOW_GLOBAL, CUSTOM_GLOBAL_PREFERENCES_DATA_STORE_KEY} from './constants'
import {warnIfMrtDataStoreBootstrapMissing} from './logging-utils'

/**
 * Returns custom global preferences from the client bootstrap payload (`#mobify-data` → `window`).
 *
 * When SSR did not enable MRT Data Store bootstrap (`isMrtDataStoreEnabled` false), **`window.__MRT_DATA_STORE__`**
 * may be **absent**; this returns **`{}`**. In development (not `production` / `test` `NODE_ENV`), each read may log
 * a warning via **`PWAKitLogger`** (`logging-utils.js`, also re-exported from `data-store-utils.js`).
 *
 * **Note:** Not called by the PWA Kit framework or template apps today; intended for customer code.
 *
 * **Client-side behavior:** Uses the DAL key `custom-global-preferences` to read from
 * `window.__MRT_DATA_STORE__`, matching the server-side storage format.
 *
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getCustomGlobalPreferences() {
    if (typeof window === 'undefined') {
        return {}
    }
    warnIfMrtDataStoreBootstrapMissing()
    const root = window[DATA_STORE_WINDOW_GLOBAL]

    // Use DAL key: custom-global-preferences
    const value =
        root && typeof root === 'object' && !Array.isArray(root)
            ? root[CUSTOM_GLOBAL_PREFERENCES_DATA_STORE_KEY]
            : undefined

    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
