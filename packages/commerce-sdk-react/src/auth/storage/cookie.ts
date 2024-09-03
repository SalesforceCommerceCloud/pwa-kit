/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'
import {getDefaultCookieAttributes} from '../../utils'
import {BaseStorage, BaseStorageOptions} from './base'

/**
 * A normalized implementation for Cookie store. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class CookieStorage extends BaseStorage {
    constructor(options?: BaseStorageOptions) {
        // TODO: Use detectCookiesAvailable when app can better handle clients with cookies disabled
        if (typeof document === 'undefined') {
            throw new Error('CookieStorage is not available on the current environment.')
        }
        super(options)
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        const suffixedKey = this.getSuffixedKey(key)
        const defaultAttributes = getDefaultCookieAttributes()

        const cookieOptions = {
            ...defaultAttributes,
            ...options,
            expires: this.convertSecondsToDate(options?.expires)
        }

        Cookies.set(suffixedKey, value, cookieOptions)
    }
    /**
     * Converts an expiration time from seconds to a `Date` object.
     * The `js-cookie` library interprets the `expires` number as days from the current time, whereas the number
     * provided by SCAPI is in seconds. So, we convert the `expires` number in seconds to a `Date` object to ensure
     * we use the correct cookie expiration time.
     *
     * @param expires - The expiration time for the cookie (in seconds or as a Date object)
     * @returns A Date instance for the cookie expiration time, or `undefined` for session cookies
     *
     * @private
     */
    private convertSecondsToDate(expires: number | Date | undefined): Date | undefined {
        if (typeof expires === 'number') {
            // Convert seconds to a Date instance
            return new Date(Date.now() + expires * 1000)
        }

        if (expires instanceof Date) {
            return expires
        }

        if (expires !== undefined) {
            console.warn(
                'Invalid "expires" option provided. It must be a number (in seconds) or a Date object.'
            )
        }

        // If expires is undefined, it results in a session cookie
        return undefined
    }
    get(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
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
        const suffixedKey = this.getSuffixedKey(key)

        Cookies.remove(suffixedKey, {
            ...getDefaultCookieAttributes(),
            ...options
        })

        // Some values, like the access token, may be split
        // across multiple keys to fit under ECOM cookie size
        // thresholds. We check for and delete additional chunks here.
        let chunk = 2
        let additionalPart = Cookies.get(`${suffixedKey}_${chunk}`)
        while (additionalPart) {
            Cookies.remove(`${suffixedKey}_${chunk}`, {
                ...getDefaultCookieAttributes(),
                ...options
            })
            chunk++
            additionalPart = Cookies.get(`${suffixedKey}_${chunk}`) || ''
        }
    }
}
