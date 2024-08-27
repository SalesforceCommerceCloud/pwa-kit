/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Returns the express app configuration file in object form that was serialized on the window object
 *
 * @returns - the application configuration object.
 */
/* istanbul ignore next */
export const getConfig = () => {
    // NOTE: window.__CONFIG__ isn't always available!
    // The global object is populated after the pwa-kit-react-sdk hydrates data on the client side.
    // To avoid unexpected behavior, if hydration is not complete, we parse the script manually here
    // so getConfig() always returns the expected object, even if it is called in the global scope.
    if (!window.__CONFIG__ && typeof document !== 'undefined') {
        try {
            const data = JSON.parse(document.getElementById('mobify-data').innerHTML)

            // Set all globals sent from the server on the window object.
            Object.entries(data).forEach(([key, value]) => {
                window[key] = value
            })
        } catch (error) {
            console.error('Unable to parse server-side rendered config.')
            console.error(error)
        }
    }
    return window.__CONFIG__
}
