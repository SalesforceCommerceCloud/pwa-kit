/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Safely parses settings from either a JSON string or object
 * @param {string|object} settings - The settings
 * @returns {object} Parsed settings object
 */
function parseSettings(settings) {
    // If settings is already an object, return it
    if (typeof settings === 'object' && settings !== null) {
        return settings
    }

    // If settings is a string, try to parse it
    if (typeof settings === 'string') {
        try {
            return JSON.parse(settings)
        } catch (error) {
            console.warn('Invalid json format:', error.message)
            return
        }
    }

    return
}

module.exports = {
    parseSettings
}
