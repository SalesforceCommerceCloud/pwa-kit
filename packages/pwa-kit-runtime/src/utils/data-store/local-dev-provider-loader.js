/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Loads the dev-only in-memory Data Store from **`@salesforce/pwa-kit-dev`**.
 * **`getDataStore`** in **`data-store-provider.js`** calls this once when resolving
 * the non-MRT path (result is cached on the provider promise, not here).
 */

import {createRequire} from 'module'

/** Workspace / linked installs use `dist/`; published `pwa-kit-dev` tarball root matches `dist/` contents. */
const LOCAL_PROVIDER_SPECIFIERS = [
    '@salesforce/pwa-kit-dev/dist/utils/mrt-data-store-local-provider.js',
    '@salesforce/pwa-kit-dev/utils/mrt-data-store-local-provider.js'
]

/**
 * Webpack may compile `import(spec)` for these package paths into an **empty** `require.context`
 * (`keys: () => []`), so runtime `import()` always fails in the SSR bundle. Use Node’s resolver
 * (`createRequire(__filename)`) so the local provider loads from the app’s `node_modules`.
 * (`__filename` is the emitted chunk path in webpack CJS server output.)
 *
 * @returns {import('module').NodeRequire | null}
 */
function getBundledNodeRequire() {
    if (typeof process === 'undefined' || !process.versions?.node) {
        return null
    }
    try {
        if (typeof __filename !== 'undefined') {
            return createRequire(__filename)
        }
    } catch {
        // ignore
    }
    return null
}

/**
 * @returns {Promise<{ createLocalMrtDataStoreProvider?: (...args: unknown[]) => unknown }>}
 */
async function importLocalMrtDataStoreProviderModule() {
    const bundledRequire = getBundledNodeRequire()
    if (bundledRequire) {
        let lastError
        for (const specifier of LOCAL_PROVIDER_SPECIFIERS) {
            try {
                return bundledRequire(specifier)
            } catch (error) {
                lastError = error
            }
        }
        throw lastError ?? new Error('Local MRT Data Store provider module not found')
    }

    let lastError
    for (const specifier of LOCAL_PROVIDER_SPECIFIERS) {
        try {
            return await import(specifier)
        } catch (error) {
            lastError = error
        }
    }
    throw lastError ?? new Error('Local MRT Data Store provider module not found')
}

/**
 * Whether the in-memory local MRT Data Store provider may be used (no DynamoDB).
 *
 * Allowed when:
 * - `PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL=true`, or
 * - `CI=true` (e.g. automated tests), or
 * - `NODE_ENV` is not `production`.
 *
 * @returns {boolean}
 */
export function isMrtDataStoreLocalProviderAllowed() {
    if (process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL === 'true') {
        return true
    }
    if (process.env.CI === 'true') {
        return true
    }
    return process.env.NODE_ENV !== 'production'
}

/**
 * Instantiate the local MRT Data Store provider (Node **`createRequire`** when available, else
 * dynamic **`import()`** of **`@salesforce/pwa-kit-dev`**).
 * Caller must ensure **`isMrtDataStoreLocalProviderAllowed()`** is true if this should succeed in production.
 *
 * @returns {Promise<{ getEntry: (key: string) => Promise<{ value?: unknown } | null> }>}
 */
export async function loadLocalMrtDataStoreProvider() {
    const mod = await importLocalMrtDataStoreProviderModule()
    if (typeof mod.createLocalMrtDataStoreProvider !== 'function') {
        throw new Error('createLocalMrtDataStoreProvider export missing')
    }
    return mod.createLocalMrtDataStoreProvider()
}
