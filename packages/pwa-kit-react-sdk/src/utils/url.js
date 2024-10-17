/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Returns the application's origin.
 *
 * NOTE: This utility can only be used server-side after your application has been
 * initialized using the `_createApp` method (This happens in your /app/ssr.js file).
 *
 * @function
 * @returns {string} Returns the ORIGIN under which we are serving the page.
 * @example
 * import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
 *
 * const url = `${getAppOrigin()}/path`
 */
export const getAppOrigin = () => {
    const config = getConfig()
    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    const {APP_ORIGIN, X_FORWARDED_HOST} = process.env

    if (config?.app?.useXForwardedHost && X_FORWARDED_HOST) {
        return X_FORWARDED_HOST
    }

    if (!APP_ORIGIN) {
        throw new Error(
            `Application is not initialized. Please ensure '_createApp' has been invoked before using this method.`
        )
    }

    return process.env.APP_ORIGIN
}
