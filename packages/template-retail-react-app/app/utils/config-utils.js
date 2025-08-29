/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Safely parses commerce agent settings from either a JSON string or object
 * @param {string|object} settings - The commerce agent settings
 * @returns {object} Parsed commerce agent settings object
 */
function parseCommerceAgentSettings(settings) {
    // Default configuration when no settings are provided
    const defaultConfig = {
        enabled: 'false',
        askAgentOnSearch: 'false',
        embeddedServiceName: '',
        embeddedServiceEndpoint: '',
        scriptSourceUrl: '',
        scrt2Url: '',
        salesforceOrgId: '',
        commerceOrgId: '',
        siteId: ''
    }

    // If settings is already an object, return it
    if (typeof settings === 'object' && settings !== null) {
        return settings
    }

    // If settings is a string, try to parse it
    if (typeof settings === 'string') {
        try {
            return JSON.parse(settings)
        } catch (error) {
            console.warn('Invalid COMMERCE_AGENT_SETTINGS format, using defaults:', error.message)
            return defaultConfig
        }
    }

    // If settings is undefined/null, return defaults
    return defaultConfig
}

module.exports = {
    parseCommerceAgentSettings
}
