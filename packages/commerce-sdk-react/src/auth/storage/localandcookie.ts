/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {BaseStorage, BaseStorageOptions} from './base'
import {LocalStorage} from './local'
import {CookieStorage} from './cookie'
import Cookies from 'js-cookie'

/**
 * This class provides a storage mechanism that sets and deletes values in both LocalStorage and CookieStorage.
 * The get method returns the value from LocalStorage if present, otherwise, the value is fetched from CookieStorage.
 * The main use case for this class is to store and get authentication tokens using LocalStorage to keep browser
 * contexts separated, while also storing the values in CookieStorage to maintain compatibility with Hybrid projects.
 */
export class LocalAndCookieStorage extends BaseStorage {
    localStorageInstance: LocalStorage
    cookieStorageInstance: CookieStorage
    constructor(options?: BaseStorageOptions) {
        super(options)
        this.localStorageInstance = new LocalStorage(options)
        this.cookieStorageInstance = new CookieStorage(options)
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        const oldValue = this.get(key)
        const suffixedKey = this.getSuffixedKey(key)

        this.localStorageInstance.set(key, value)
        this.cookieStorageInstance.set(key, value, options)

        const event = new StorageEvent('storage', {
            key: suffixedKey,
            oldValue: oldValue,
            newValue: value
        })
        window.dispatchEvent(event)
    }

    get(key: string) {
        const localStorageValue = this.localStorageInstance.get(key)
        const cookieStorageValue = this.cookieStorageInstance.get(key)

        return localStorageValue || cookieStorageValue || ''
    }
    delete(key: string, options?: Cookies.CookieAttributes) {
        const suffixedKey = this.getSuffixedKey(key)
        const oldValue = this.get(suffixedKey)

        this.localStorageInstance.delete(key)
        this.cookieStorageInstance.delete(key, options)

        const localStorageEvent = new StorageEvent('storage', {
            key: suffixedKey,
            oldValue: oldValue,
            newValue: null
        })
        window.dispatchEvent(localStorageEvent)
    }
}
