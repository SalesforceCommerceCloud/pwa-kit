/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @typedef {{ value?: unknown }} MrtDataStoreEntry
 */

/**
 * @typedef {{ kind: 'local'; getEntry: (key: string) => Promise<MrtDataStoreEntry | null> }} LocalMrtDataStoreProvider
 */

/**
 * @typedef {{ defaults?: Record<string, Record<string, unknown>>; warnOnMissing?: boolean }} LocalMrtDataStoreProviderOptions
 */

/**
 * Create an in-memory MRT Data Store provider for local development when DynamoDB is unavailable.
 *
 * Environment:
 * - `PWAKIT_MRT_DATA_STORE_DEFAULTS` — optional JSON map of full DAL keys to preference objects.
 * - `PWAKIT_MRT_DATA_STORE_WARN_ON_MISSING` — set to `false` to silence missing-key warnings.
 *
 * @param {LocalMrtDataStoreProviderOptions} [options]
 * @returns {LocalMrtDataStoreProvider}
 */
export function createLocalMrtDataStoreProvider(options = {}) {
    const defaults = options.defaults ?? readDefaultsFromEnv()
    const warnOnMissing = options.warnOnMissing ?? readWarnOnMissingFromEnv()
    const warnedKeys = new Set()

    return {
        kind: 'local',
        getEntry(key) {
            const value = defaults[key]
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return Promise.resolve({value})
            }

            if (warnOnMissing && !warnedKeys.has(key)) {
                warnedKeys.add(key)

                console.warn(
                    `Local MRT Data Store provider did not find '${key}'. Returning an empty object for development.`
                )
            }

            return Promise.resolve({value: {}})
        }
    }
}

/**
 * @returns {Record<string, Record<string, unknown>>}
 */
function readDefaultsFromEnv() {
    const raw = process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS
    if (!raw) {
        return {}
    }

    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed
        }
    } catch (error) {
        console.warn('Failed to parse PWAKIT_MRT_DATA_STORE_DEFAULTS JSON.', error)
    }

    return {}
}

/**
 * @returns {boolean}
 */
function readWarnOnMissingFromEnv() {
    const raw = process.env.PWAKIT_MRT_DATA_STORE_WARN_ON_MISSING
    if (!raw) {
        return true
    }
    return raw.toLowerCase() !== 'false'
}
