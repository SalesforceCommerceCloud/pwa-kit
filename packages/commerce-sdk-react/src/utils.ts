/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import Cookies, {CookieAttributes} from 'js-cookie'
import {IFRAME_HOST_ALLOW_LIST} from './constant'

/**
 * Utility to determine if you are on the browser (client) or not.
 */
export const onClient = (): boolean => typeof window !== 'undefined'

export const getCookieSameSiteAttribute = () => {
    if (!onClient()) return
    // document.location?.ancestorOrigins?.[0] will provide the parent host url, but it only works for Chrome and Safari.
    // Firefox does not have this field. document.referrer is common use for parent url, but it could be less reliable.
    // It is best to use it a fallback option for Firefox
    const parentUrl = document.location?.ancestorOrigins?.[0] || document.referrer
    const parentHostName = parentUrl ? new URL(parentUrl).hostname : ''
    const isParentSiteTrusted = IFRAME_HOST_ALLOW_LIST.includes(parentHostName)
    const isLocalHost = window.location.hostname === 'localhost'

    return !isLocalHost && isParentSiteTrusted ? 'none' : 'Lax'
}

/**
 * Determines whether local storage is available by trying to set a test value.
 */
export function detectLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false
    try {
        // If `localStorage` is not available, simply accessing the property will throw an error
        window.localStorage
        return true
    } catch {
        return false
    }
}

/**
 * Determines whether cookies are available by trying to set a test value.
 */
export function detectCookiesAvailable() {
    if (typeof document === 'undefined') return false
    const testKey = 'commerce-sdk-react-temp'
    const testValue = '1'
    const options: CookieAttributes = {
        // These options MUST match what is used by CookieStorage for this test to be reliable
        secure: !onClient() || window.location.protocol === 'https:',
        sameSite: getCookieSameSiteAttribute()
    }
    try {
        Cookies.set(testKey, testValue, options)
        const success = Cookies.get(testKey) === testValue
        Cookies.remove(testKey, options)
        return success
    } catch {
        return false
    }
}
