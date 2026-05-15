/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import createLogger from '../logger-factory'
import {
    DataStore,
    DataStoreNotFoundError,
    DataStoreServiceError,
    DataStoreUnavailableError
} from '@salesforce/mrt-utilities/data-store'

// Implementation in `logging-utils.js` (logger + constants; no `DataStore`) so client bundles stay small.
// Client preference modules import `./logging-utils` directly; server code may import from here.
export {warnIfMrtDataStoreBootstrapMissing} from './logging-utils'

/**
 * Get the DataStore singleton instance from mrt-utilities.
 * Uses conditional exports: dev-data-store in development, production in builds.
 *
 * @returns {DataStore} The DataStore instance
 */
export function getDataStore() {
    return DataStore.getDataStore()
}

/**
 * Whether the Managed Runtime env trio is present (AWS_REGION, MOBIFY_PROPERTY_ID, DEPLOY_TARGET).
 *
 * @returns {boolean}
 */
export function hasMrtEnvironment() {
    return Boolean(
        process.env.AWS_REGION && process.env.MOBIFY_PROPERTY_ID && process.env.DEPLOY_TARGET
    )
}

/**
 * Reset cached provider (for tests).
 * Resets the DataStore singleton so tests can configure environment variables.
 */
export function resetDataStoreProviderCacheForTests() {
    // Reset the DataStore singleton from mrt-utilities
    // This allows tests to reconfigure env vars and get a fresh instance
    DataStore._instance = null
}

/**
 * Parse PWAKIT_MRT_DATA_STORE_ENABLED when set; invalid values are ignored (fall through to config). (cspell:disable-line)
 * @param {string | undefined} raw
 * @returns {boolean | null} true/false when explicit, null when unset or invalid
 */
function parseMrtDataStoreEnabledFromEnv(raw) {
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return null
    }
    const v = String(raw).trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(v)) {
        return true
    }
    if (['0', 'false', 'no', 'off'].includes(v)) {
        return false
    }
    return null
}

/**
 * Whether this app should **resolve and serialize** MRT Data Store custom preferences during SSR
 * (`getCustomSitePreferences` / `getCustomGlobalPreferences` on the server, then `__MRT_DATA_STORE__`
 * in `#mobify-data` when enabled).
 *
 * This is **not** the same as **`DataStore.isDataStoreAvailable()`** in **`utils/ssr-server/data-store`**:
 * the Lambda may still have a Data Store client while this flag is off (no `__MRT_DATA_STORE__` bootstrap).
 *
 * **`getPlainObjectForDataStoreKey`** uses **`getDataStore()`** (cached): MRT
 * **`DataStore`** when **`hasMrtEnvironment()`** is true; otherwise the local dev provider or a no-op
 * provider — see **`data-store-provider.js`**.
 *
 * **Opt-in:** off unless `config.app.mrtDataStore.enabled === true` or
 * `PWAKIT_MRT_DATA_STORE_ENABLED` is a recognized truthy/falsey string (`true`, `1`, `yes`, `on` / `false`, `0`, …). (cspell:disable-line)
 *
 * Env takes precedence when set to a recognized value so ops can force on/off without a rebuild
 * (when env is injected at runtime).
 *
 * @param {{ app?: { mrtDataStore?: { enabled?: boolean } } }} [config] - Result of `getConfig()`.
 * @returns {boolean}
 */
export function isMrtDataStoreEnabled(config) {
    const fromEnv = parseMrtDataStoreEnabledFromEnv(process.env.PWAKIT_MRT_DATA_STORE_ENABLED) // cspell:disable-line
    if (fromEnv !== null) {
        return fromEnv
    }
    return config?.app?.mrtDataStore?.enabled === true
}

const logger = createLogger({packageName: 'pwa-kit-runtime'})

/**
 * Load a plain JSON object for SSR by Data Store key.
 * Use for entries that should surface as `Record<string, unknown>` in apps
 * (custom site/global preferences and similar keys).
 *
 * Uses the DataStore singleton from mrt-utilities. The conditional export ensures
 * the correct implementation loads (dev-data-store in development, DynamoDB in production).
 *
 * @param {{
 *   dataStoreKey: string | null,
 *   logNamespace: string,
 *   serviceErrorMessage: string
 * }} options
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getPlainObjectForDataStoreKey({
    dataStoreKey,
    logNamespace,
    serviceErrorMessage
}) {
    if (!dataStoreKey) {
        return {}
    }

    const store = getDataStore()

    try {
        const entry = await store.getEntry(dataStoreKey)
        // mrt-utilities returns { key, value } or throws DataStoreNotFoundError
        const value = entry?.value
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value
        }
        return {}
    } catch (error) {
        if (error instanceof DataStoreUnavailableError) {
            // Data store not available (missing MRT env vars or mocked to be unavailable)
            return {}
        }
        if (error instanceof DataStoreNotFoundError) {
            return {}
        }
        if (error instanceof DataStoreServiceError) {
            logger.error(serviceErrorMessage, {
                namespace: logNamespace,
                key: dataStoreKey,
                error
            })
            return {}
        }
        throw error
    }
}
