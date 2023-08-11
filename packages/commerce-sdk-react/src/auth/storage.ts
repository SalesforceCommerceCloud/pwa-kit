/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'
import {onClient} from '../utils'

export type StorageType = 'cookie' | 'local' | 'memory'

export interface BaseStorageOptions {
    keySuffix?: string
}

export interface MemoryStorageOptions extends BaseStorageOptions {
    sharedContext?: boolean
}
export abstract class BaseStorage {
    protected options: BaseStorageOptions = {}

    constructor(options?: BaseStorageOptions) {
        this.options = {
            keySuffix: options?.keySuffix ?? ''
        }
    }

    protected getSuffixedKey(key: string): string {
        return this.options.keySuffix ? `${key}_${this.options.keySuffix}` : key
    }
    abstract set(key: string, value: string, options?: unknown): void
    abstract get(key: string): string
    abstract delete(key: string): void
}

/**
 * A normalized implementation for Cookie store. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class CookieStorage extends BaseStorage {
    constructor(options?: BaseStorageOptions) {
        super(options)

        if (typeof document === 'undefined') {
            throw new Error('CookieStorage is not available on the current environment.')
        }
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        const suffixedKey = this.getSuffixedKey(key)
        const isInIframe = window.location !== window.parent.location
        const isLocalHost = window.location.hostname === 'localhost'
        Cookies.set(suffixedKey, value, {
            // Deployed sites will always be HTTPS, but the local dev server is served over HTTP.
            // Ideally, this would be `secure: true`, because Chrome and Firefox both treat
            // localhost as a Secure context. But Safari doesn't, so here we are.
            secure: !onClient() || window.location.protocol === 'https:',
            // By default, Chromes does not allow cookies to be sent/read
            // when the code is loaded in iframe (e.g storefront preview case)
            // setting sameSite to none lose that restriction to
            // make sure that cookies can be read/sent when code is loaded in an iframe
            // outside of iframe, we want to keep that restriction to avoid security risk
            // https://web.dev/samesite-cookie-recipes/
            sameSite: !isLocalHost && isInIframe ? 'none' : 'strict',
            ...options
        })
    }
    get(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        return Cookies.get(suffixedKey) || ''
    }
    delete(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        Cookies.remove(suffixedKey)
    }
}

/**
 * A normalized implementation for LocalStorage. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class LocalStorage extends BaseStorage {
    constructor(options?: BaseStorageOptions) {
        super(options)

        if (typeof window === 'undefined') {
            throw new Error('LocalStorage is not avaliable on the current environment.')
        }
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

const globalMap = new Map()

export class MemoryStorage extends BaseStorage {
    private map: Map<string, string>
    constructor(options?: MemoryStorageOptions) {
        super(options)

        this.map = options?.sharedContext ? globalMap : new Map()
    }
    set(key: string, value: string) {
        const suffixedKey = this.getSuffixedKey(key)
        this.map.set(suffixedKey, value)
    }
    get(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        return this.map.get(suffixedKey) || ''
    }
    delete(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        this.map.delete(suffixedKey)
    }
}
