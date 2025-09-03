/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Generates the sfdc_user_agent header value containing SDK version information.
 * This header helps identify and track SDK versions invoking SCAPI for debugging
 * and metrics purposes.
 *
 * @returns {string} The sfdc_user_agent header value in format: pwa-kit-react-sdk@version commerce-sdk-react@version
 */
export const generateSfdcUserAgent = () => {
    try {
        // Using require here because this runs at initialization time when version info is static
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const retailAppPkg = require('../../package.json')

        const commerceSdkVersion =
            retailAppPkg.dependencies?.['@salesforce/commerce-sdk-react'] || 'unknown'
        const pwaKitVersion =
            retailAppPkg.dependencies?.['@salesforce/pwa-kit-react-sdk'] || 'unknown'

        // Using @ format to align with NPM package@version conventions for better tooling compatibility
        return `pwa-kit-react-sdk@${pwaKitVersion} commerce-sdk-react@${commerceSdkVersion}`.trim()
    } catch (error) {
        console.warn('Unable to generate sfdc_user_agent header:', error)
        return 'pwa-kit-react-sdk@unknown commerce-sdk-react@unknown'
    }
}
