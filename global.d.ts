/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Global variables injected by webpack at build time
 */
declare global {
    /**
     * Feature flag for marketing consent preferences extension
     * Injected by webpack DefinePlugin
     */
    const SFDC_EXT_MARKETING_CONSENT_ENABLED: boolean
}

export {}
