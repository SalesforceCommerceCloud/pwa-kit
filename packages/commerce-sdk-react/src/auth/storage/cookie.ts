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
        Cookies.set(suffixedKey, value, {
            ...getDefaultCookieAttributes(),
            ...options
        })
    }
    get(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        return Cookies.get(suffixedKey) || ''
    }
    delete(key: string) {
        const suffixedKey = this.getSuffixedKey(key)

        // We usually use `Cookies.remove(key)` from the `js-cookie` library to delete a cookie. But, this
        // method fails when removing a cookie on an iframed website like within StorefrontPreview on WebKit
        // browsers such as Chrome and Safari.
        const samesite = 'none'
        const expirationDate = new Date('Thu, 01 Jan 1970 00:00:00 UTC')

        // Set the expiration date in the past to delete the cookie
        document.cookie = `${suffixedKey}=; expires='${expirationDate.toUTCString()}'; secure; samesite=${samesite}`

        // Check if the Cookie Doesn't Exist
        const existingCookie = Cookies.get(suffixedKey)
        if (existingCookie) {
            console.error(`Failed to remove the cookie ${suffixedKey}`)
        }

    }


}
