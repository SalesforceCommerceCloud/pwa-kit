/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * Returns the application's origin.
 *
 * NOTE: This utility can only be used server-side after your application has been
 * initialized using the `createApp` method (This happens in your /app/ssr.js file).
 *
 * @function
 * @returns {string} Returns the ORIGIN under which we are serving the page.
 * @example
 * import {getAppOrigin} from 'pwa-kit-react-sdk/dist/utils/url'
 *
 * const url = `${getAppOrigin()}/path`
 */
export const getAppOrigin = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    const {APP_ORIGIN} = process.env

    if (!APP_ORIGIN) {
        throw new Error(
            `Application is not initialized. Please ensure 'createApp' has been invoked before using this method.`
        )
    }

    return process.env.APP_ORIGIN
}
