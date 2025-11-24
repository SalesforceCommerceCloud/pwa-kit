/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Resolve the Google Cloud API key from the configurations
 * It will only return a key if the FT is enabled
 * regardless of the key being provided by the platform or the MRT env variable
 * Custom keys(MRT Env variable) take precedence over the platform provided key
 *
 * @param {Object} configurations - The configurations object
 * @returns {string} The Google Cloud API key
 */
export default function resolveGoogleCloudAPIKey(configurations) {
    // If the FT is not enabled, the gcp API key will not be returned from the Shopper Config API
    // Therefore the presence of the SF platform provided key is also serving as our feature toggle
    const platformProvidedKey = configurations?.configurations?.find(
        (config) => config.id === 'gcp'
    )?.value

    return !platformProvidedKey
        ? null
        : getConfig()?.app?.googleCloudAPI?.apiKey || platformProvidedKey
}
