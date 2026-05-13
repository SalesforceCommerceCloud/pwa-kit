/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'
import {getDefaultCookieAttributes} from '../../utils'
import {BaseStorage, BaseStorageOptions} from './base'
import {EXCLUDE_COOKIE_SUFFIX} from '../../constant'

export interface CookieStorageOptions extends BaseStorageOptions {
    cookieDomain?: string
}

/**
 * A normalized implementation for Cookie store. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class CookieStorage extends BaseStorage {
    private cookieDomain: string | undefined
    constructor(options?: CookieStorageOptions) {
        // TODO: Use detectCookiesAvailable when app can better handle clients with cookies disabled
        if (typeof document === 'undefined') {
            throw new Error('CookieStorage is not available on the current environment.')
        }
        super(options)
        // We can catch known-invalid patterns here, but complete validation is not possible
        // since domain matching depends on the runtime host (e.g., '.example.com' is valid
        // on shop.example.com but will be silently rejected by the browser on localhost).
        if (options?.cookieDomain) {
            if (/[*,;=\s]/.test(options.cookieDomain)) {
                console.warn(
                    `CookieStorage: Invalid cookieDomain "${options.cookieDomain}". ` +
                        'Cookie domains must not contain wildcards or special characters. ' +
                        'Example: ".example.com"'
                )
            }
            this.cookieDomain = options.cookieDomain
        }
    }
    /**
     * Merges cookie attributes in order of increasing precedence:
     * 1. Default attributes (secure, sameSite) from getDefaultCookieAttributes()
     * 2. The cookieDomain configured at construction time (if set)
     * 3. Per-call options passed to set() or delete(), which take highest priority
     *    and can override any of the above, including the domain
     */
    private getAttributes(options?: Cookies.CookieAttributes): Cookies.CookieAttributes {
        return {
            ...getDefaultCookieAttributes(),
            ...(this.cookieDomain && {domain: this.cookieDomain}),
            ...options
        }
    }
    /**
     * Removes a cookie by key, targeting both the domain-scoped version and any
     * pre-existing host-scoped version. When cookieDomain is configured, browsers
     * treat host-scoped and domain-scoped cookies as separate entries. Without
     * cleaning up both, stale host-scoped cookies from before cookieDomain was
     * enabled would persist and cause session conflicts.
     */
    private removeHostAndDomainCookie(key: string, options?: Cookies.CookieAttributes) {
        Cookies.remove(key, this.getAttributes(options))
        if (this.cookieDomain) {
            Cookies.remove(key, getDefaultCookieAttributes())
        }
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        const suffixedKey = EXCLUDE_COOKIE_SUFFIX.includes(key) ? key : this.getSuffixedKey(key)
        // When cookieDomain is configured, remove any pre-existing cookie scoped to the
        // implicit host (no domain attribute). Without this, the browser would keep both
        // the old host-scoped cookie and the new domain-scoped cookie, causing conflicts
        // since Cookies.get() returns a non-deterministic match when duplicates exist.
        //
        // Note: The reverse case (removing cookieDomain after it was previously set) is
        // not handled here because we have no way to know the previous domain value.
        // In that scenario, old domain-scoped cookies will persist until they expire
        // naturally. Merchants disabling cookieDomain should be aware that existing
        // shoppers may need to clear their cookies manually.
        if (this.cookieDomain && Cookies.get(suffixedKey)) {
            this.removeHostAndDomainCookie(suffixedKey, options)
        }
        Cookies.set(suffixedKey, value, this.getAttributes(options))
    }
    get(key: string) {
        const suffixedKey = EXCLUDE_COOKIE_SUFFIX.includes(key) ? key : this.getSuffixedKey(key)
        let value = Cookies.get(suffixedKey) || ''
        if (value) {
            // Some values, like the access token, may be split
            // across multiple keys to fit under ECOM cookie size
            // thresholds. We check for and append additional chunks here.
            let chunk = 2
            let additionalPart = Cookies.get(`${suffixedKey}_${chunk}`)
            while (additionalPart) {
                value = value.concat(additionalPart)
                chunk++
                additionalPart = Cookies.get(`${suffixedKey}_${chunk}`) || ''
            }
        }

        return value
    }
    delete(key: string, options?: Cookies.CookieAttributes) {
        const suffixedKey = EXCLUDE_COOKIE_SUFFIX.includes(key) ? key : this.getSuffixedKey(key)

        this.removeHostAndDomainCookie(suffixedKey, options)

        // Some values, like the access token, may be split
        // across multiple keys to fit under ECOM cookie size
        // thresholds. We check for and delete additional chunks here.
        let chunk = 2
        let additionalPart = Cookies.get(`${suffixedKey}_${chunk}`)
        while (additionalPart) {
            this.removeHostAndDomainCookie(`${suffixedKey}_${chunk}`, options)
            chunk++
            additionalPart = Cookies.get(`${suffixedKey}_${chunk}`) || ''
        }
    }
}
