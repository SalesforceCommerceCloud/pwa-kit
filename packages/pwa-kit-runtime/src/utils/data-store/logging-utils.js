/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import createLogger from '../logger-factory'
import {DATA_STORE_WINDOW_GLOBAL} from './constants'

const logger = createLogger({packageName: 'pwa-kit-runtime'})

/**
 * When `window.__MRT_DATA_STORE__` is absent (SSR did not serialize the bootstrap because
 * `isMrtDataStoreEnabled` was false), log with **`PWAKitLogger.warn`** (namespace `mrt-data-store.bootstrap`).
 * Skips production and Jest (`NODE_ENV` `production` / `test`) to avoid shopper noise and test spam.
 *
 * @returns {void}
 */
export function warnIfMrtDataStoreBootstrapMissing() {
    if (typeof window === 'undefined') {
        return
    }
    if (window[DATA_STORE_WINDOW_GLOBAL] !== undefined) {
        return
    }
    const env = process.env.NODE_ENV
    if (env === 'production' || env === 'test') {
        return
    }
    logger.warn(
        '`window.__MRT_DATA_STORE__` is not set. MRT Data Store bootstrap was not serialized for this load (enable `app.mrtDataStore.enabled` or `PWAKIT_MRT_DATA_STORE_ENABLED`). `getCustomSitePreferences` / `getCustomGlobalPreferences` return `{}`.',
        {namespace: 'mrt-data-store.bootstrap'}
    )
}
