/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {detectLocalStorageAvailable} from '../../utils'
import {BaseStorage, BaseStorageOptions} from './base'

/**
 * A normalized implementation for LocalStorage. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class LocalStorage extends BaseStorage {
    constructor(options?: BaseStorageOptions) {
        if (!detectLocalStorageAvailable()) {
            throw new Error('LocalStorage is not available on the current environment.')
        }
        super(options)
    }
    set(key: string, value: string) {
        const oldValue = this.get(key)
        const suffixedKey = this.getSuffixedKey(key)
        window.localStorage.setItem(suffixedKey, value)
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
        const event = new StorageEvent('storage', {
            key: suffixedKey,
            oldValue: oldValue,
            newValue: null
        })
        window.dispatchEvent(event)
    }
}
