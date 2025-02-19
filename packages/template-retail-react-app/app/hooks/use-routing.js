/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useBlockNavigation} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'

/**
 * Update the routes of the application while navigation is blocked
 *
 * @param {func} callback Optional function to run while navigation is blocked
 */
export const useRouting = (callback) => {
    const config = getConfig()
    if (config.app.PWA_BMRouting !== 'true') return false

    const isBlocked = useBlockNavigation(async () => {
        // In W-17530042, updateRoutes will be used here and return false after API call completion
        // A manual delay is added for now just to see the skeleton that would show while the API call is made
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
        await delay(10000)

        if (typeof callback === 'function') await callback()

        return false
    })

    return isBlocked
}
