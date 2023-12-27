/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {BaseStorage, BaseStorageOptions} from './base'
import Cookies from 'js-cookie'
import {getDefaultCookieAttributes} from '../../utils'

/**
 * A normalized implementation for LocalStorage. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class LocalAndCookieStorage extends BaseStorage {
    constructor(options?: BaseStorageOptions) {
        // TODO: Use detectLocalStorageAvailable when app can better handle clients without storage
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            throw new Error('LocalAndCookieStorage is not available on the current environment.')
        }
        super(options)
    }
    set(key: string, value: string) {
        const oldValue = this.get(key)
        const suffixedKey = this.getSuffixedKey(key)
        window.localStorage.setItem(suffixedKey, value)
        Cookies.set(suffixedKey, value, {
            ...getDefaultCookieAttributes()
        })
        // Changes to localStorage automatically dispatch a storage event in every tab where a site
        // is loaded, *except* the original tab that made the change. To allow our `useLocalStorage`
        // hook to work in the originating tab, we must dispatch a copy of the event. This event is
        // only seen by the originating tab. A key difference with this event is that `isTrusted` is
        // false, but that should not impact our use case.
        const event = new StorageEvent('storage', {
            key: suffixedKey,
            oldValue: oldValue,
            newValue: value
        })
        window.dispatchEvent(event)
    }
    get(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        return window.localStorage.getItem(suffixedKey) || ''
    }
    delete(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        const oldValue = this.get(suffixedKey)
        window.localStorage.removeItem(suffixedKey)
        Cookies.remove(suffixedKey, {
            ...getDefaultCookieAttributes()
        })
        // Changes to localStorage automatically dispatch a storage event in every tab where a site
        // is loaded, *except* the original tab that made the change. To allow our `useLocalStorage`
        // hook to work in the originating tab, we must dispatch a copy of the event. This event is
        // only seen by the originating tab. A key difference with this event is that `isTrusted` is
        // false, but that should not impact our use case.
        const event = new StorageEvent('storage', {
            key: suffixedKey,
            oldValue: oldValue,
            newValue: null
        })
        window.dispatchEvent(event)
    }
}
