/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import Cookies, {CookieAttributes} from 'js-cookie'
import {IFRAME_HOST_ALLOW_LIST} from './constant'

/** Utility to determine if you are on the browser (client) or not. */
export const onClient = (): boolean => typeof window !== 'undefined'

/** Detects whether the storefront is running in an iframe. */
export const detectInIframe = () => typeof window !== 'undefined' && window.top !== window.self

/**
 * Origin used for local Runtime Admin.
 * @private
 */
export const DEVELOPMENT_ORIGIN = 'http://localhost:4000'

/**
 * Gets the parent origin when running in an iframe.
 * @private
 */
export const getParentOrigin = () => {
    if (detectInIframe()) {
        // location.ancestorOrigins[0] will provide the parent host url, but it only works for Chrome and Safari.
        // Firefox does not have this field. document.referrer is common use for parent url, but it could be less reliable.
        // It is best to use it a fallback option for Firefox
        if (window.location.ancestorOrigins) return window.location.ancestorOrigins[0]
        if (document.referrer) return new URL(document.referrer).origin
    }
}

/**
 * Determines whether the given origin is trusted to host the storefront in an iframe.
 * @private
 */
export const isOriginTrusted = (origin: string | undefined) => {
    return Boolean(
        origin &&
            (window.location.hostname === 'localhost'
                ? origin === DEVELOPMENT_ORIGIN // Development
                : IFRAME_HOST_ALLOW_LIST.includes(origin)) // Production
    )
}

/**
 * Gets the value to use for the `sameSite` cookie attribute.
 * @returns `undefined` if running on the server, `"none"` if running as an iframe on a trusted site
 * (i.e. Storefront Preview), otherwise `"Lax"`
 */
export const getCookieSameSiteAttribute = () => {
    if (!onClient()) return
    const isLocalHost = window.location.hostname === 'localhost'
    const parentOrigin = getParentOrigin()
    return !isLocalHost && isOriginTrusted(parentOrigin) ? 'none' : 'Lax'
}

/**
 * Gets the default cookie attributes. Sets the secure flag unless running on localhost in Safari.
 * Sets the sameSite attribute to `"none"` when running in a trusted iframe.
 */
export const getDefaultCookieAttributes = (): CookieAttributes => {
    return {
        // Deployed sites will always be HTTPS, but the local dev server is served over HTTP.
        // Ideally, this would be `secure: true`, because Chrome and Firefox both treat
        // localhost as a Secure context. But Safari doesn't, so here we are.
        secure: !onClient() || window.location.protocol === 'https:',
        // By default, Chrome does not allow cookies to be sent/read when the code is loaded in
        // an iframe (e.g storefront preview). Setting sameSite to "none" loosens that
        // restriction, but we only want to do so when when the iframe parent is in our allow
        // list. Outside of iframe, we want to keep most browser default value (Chrome or Firefox uses Lax)
        // https://web.dev/samesite-cookie-recipes/
        sameSite: getCookieSameSiteAttribute()
    }
}

/** Determines whether local storage is available. */
export function detectLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false
    try {
        // If access to `localStorage` is forbidden, accessing the property will throw an error
        return Boolean(window.localStorage)
    } catch {
        return false
    }
}

/** Determines whether cookies are available by trying to set a test value. */
export function detectCookiesAvailable(options?: CookieAttributes) {
    if (typeof document === 'undefined') return false
    if (!navigator.cookieEnabled) return false
    // Even if `cookieEnabled` is true, cookies may not work. A site may allow first-party, but not
    // third-party, a browser extension may block cookies, etc. The most reliable way to detect if
    // cookies are available is to try to set one
    const testKey = 'commerce-sdk-react-temp'
    const testValue = '1'
    const netOptions = {
        ...getDefaultCookieAttributes(),
        ...options
    }
    try {
        Cookies.set(testKey, testValue, netOptions)
        const success = Cookies.get(testKey) === testValue
        Cookies.remove(testKey, netOptions)
        return success
    } catch {
        return false
    }
}
