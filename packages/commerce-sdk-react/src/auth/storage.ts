/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'

export interface BaseStorage {
    set(key: string, value: string, options?: unknown): void
    get(key: string): string
    delete(key: string): void
}

/**
 * A normalized implementation for Cookie store. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class CookieStorage implements BaseStorage {
    constructor() {
        if (typeof document === 'undefined') {
            throw new Error('CookieStorage is not avaliable on the current environment.')
        }
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        Cookies.set(key, value, {...options, secure: true})
    }
    get(key: string) {
        return Cookies.get(key) || ''
    }
    delete(key: string) {
        Cookies.remove(key)
    }
}

/**
 * A normalized implementation for LocalStorage. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class LocalStorage implements BaseStorage {
    constructor() {
        if (typeof window === 'undefined') {
            throw new Error('LocalStorage is not avaliable on the current environment.')
        }
    }
    set(key: string, value: string) {
        window.localStorage.setItem(key, value)
    }
    get(key: string) {
        return window.localStorage.getItem(key) || ''
    }
    delete(key: string) {
        window.localStorage.removeItem(key)
    }
}
