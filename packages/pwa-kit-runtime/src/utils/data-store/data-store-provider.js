/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Default Data Store provider for SSR (same idea as storefront-next’s default provider):
 * one resolved implementation per process — either the real MRT **`DataStore`**, the in-memory
 * local provider from **`@salesforce/pwa-kit-dev`**, or a no-op provider that yields empty entries.
 * Callers use **`getEntry(key)`** regardless of source.
 */

import createLogger from '../logger-factory'
import {DataStore, DataStoreNotFoundError} from '../ssr-server/data-store'
import {
    isMrtDataStoreLocalProviderAllowed,
    loadLocalMrtDataStoreProvider
} from './local-dev-provider-loader'

const logger = createLogger({packageName: 'pwa-kit-runtime'})

/** @typedef {{ kind: 'mrt' | 'local' | 'noop', getEntry: (key: string) => Promise<{ value?: unknown } | null | undefined> }} DataStoreProvider */

/** @type {Promise<DataStoreProvider> | null} */
let providerPromise = null

/**
 * Reset cached provider (for tests).
 */
export function resetDataStoreProviderCacheForTests() {
    providerPromise = null
}

/**
 * Whether the Managed Runtime env trio is present (`AWS_REGION`, `MOBIFY_PROPERTY_ID`, `DEPLOY_TARGET`).
 *
 * @returns {boolean}
 */
export function hasMrtEnvironment() {
    return Boolean(
        process.env.AWS_REGION && process.env.MOBIFY_PROPERTY_ID && process.env.DEPLOY_TARGET
    )
}

/**
 * @returns {DataStoreProvider}
 */
function createMrtDataStoreProvider() {
    return {
        kind: 'mrt',
        async getEntry(key) {
            const store = DataStore.getDataStore()
            if (!store.isDataStoreAvailable()) {
                logger.warn('MRT Data Store client is not available; entry cannot be loaded.', {
                    namespace: 'data-store-provider',
                    additionalProperties: {key}
                })
                return null
            }
            try {
                const entry = await store.getEntry(key)
                const value = entry?.value
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return entry
                }
                logger.warn(
                    'MRT Data Store has no usable plain-object value for this key (missing entry, wrong shape, or empty).',
                    {
                        namespace: 'data-store-provider',
                        additionalProperties: {key, hasEntry: entry != null}
                    }
                )
                return entry
            } catch (error) {
                if (error instanceof DataStoreNotFoundError) {
                    logger.warn('MRT Data Store entry not found for key.', {
                        namespace: 'data-store-provider',
                        additionalProperties: {key}
                    })
                }
                throw error
            }
        }
    }
}

/**
 * @returns {DataStoreProvider}
 */
function createNoOpDataStoreProvider() {
    return {
        kind: 'noop',
        async getEntry() {
            return {value: {}}
        }
    }
}

/**
 * @returns {Promise<DataStoreProvider>}
 */
async function resolveNonMrtProvider() {
    if (!isMrtDataStoreLocalProviderAllowed()) {
        return createNoOpDataStoreProvider()
    }
    try {
        const local = await loadLocalMrtDataStoreProvider()
        return {
            kind: 'local',
            getEntry: (key) => local.getEntry(key)
        }
    } catch (error) {
        logger.warn('Local MRT Data Store provider could not be loaded or used.', {
            namespace: 'data-store-provider',
            message:
                'Add @salesforce/pwa-kit-dev (devDependency), run its build, or set MRT env vars for the real Data Store.',
            error
        })
        return createNoOpDataStoreProvider()
    }
}

/**
 * Resolve the default Data Store provider for the current environment (cached).
 *
 * @returns {Promise<DataStoreProvider>}
 */
export function getDataStore() {
    if (providerPromise) {
        return providerPromise
    }
    providerPromise = hasMrtEnvironment()
        ? Promise.resolve(createMrtDataStoreProvider())
        : resolveNonMrtProvider()
    return providerPromise
}

/**
 * Resolves the cached provider so subsequent **`getDataStore()`** / **`getEntry`** calls share one
 * implementation (MRT vs local vs no-op).
 *
 * @returns {Promise<void>}
 */
export async function initializeDataStore() {
    await getDataStore()
}
