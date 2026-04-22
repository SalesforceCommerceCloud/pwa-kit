/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Window / DAL constants for bootstrap data (SSR → `#mobify-data` → `window`).
 * Serialized Data Store payloads live under a single `window` key; add new entries there
 * and matching properties under `DATA_STORE_WINDOW_GLOBAL`.
 */

/**
 * Single `window` / `#mobify-data` key for SSR-serialized Data Store bootstrap JSON.
 * Omitted entirely when `isMrtDataStoreEnabled` is false (not serialized as `{}`).
 */
export const DATA_STORE_WINDOW_GLOBAL = '__MRT_DATA_STORE__'

/**
 * Property under `window[DATA_STORE_WINDOW_GLOBAL]` for resolved site-scoped preferences.
 * (DAL key is still `<siteId>-custom-site-preferences`; this is only the bootstrap object shape.)
 */
export const DATA_STORE_BOOTSTRAP_SITE_PREFERENCES_KEY = 'customSitePreferences'

/** Property under `window[DATA_STORE_WINDOW_GLOBAL]` for resolved global preferences. */
export const DATA_STORE_BOOTSTRAP_GLOBAL_PREFERENCES_KEY = 'customGlobalPreferences'

/**
 * DAL / Data Store key suffix; full key is `<siteId>${CUSTOM_SITE_PREFERENCES_KEY_SUFFIX}`.
 */
export const CUSTOM_SITE_PREFERENCES_KEY_SUFFIX = '-custom-site-preferences'

/**
 * Full DAL / Data Store key for org/global custom preferences (no site id prefix).
 */
export const CUSTOM_GLOBAL_PREFERENCES_DATA_STORE_KEY = 'custom-global-preferences'
