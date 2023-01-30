/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'

export type StorageType = 'cookie' | 'local' | 'memory'

export interface BaseStorageOptions {
    keyPrefix?: string
    keyPrefixSeparator?: string
}

export interface MemoryStorageOptions extends BaseStorageOptions {
    sharedContext?: boolean
}
export abstract class BaseStorage {
    protected options: Required<BaseStorageOptions>

    constructor(options: BaseStorageOptions = {keyPrefixSeparator: '_'}) {
        this.options = {
            keyPrefixSeparator: options.keyPrefix ? options.keyPrefixSeparator ?? '_' : '',
            keyPrefix: options.keyPrefix ?? ''
        }
    }

    protected getPrefixedKey(key: string): string {
        return `${this.options.keyPrefix}${this.options.keyPrefixSeparator}${key}`
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
            throw new Error('CookieStorage is not avaliable on the current environment.')
        }
    }
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        const prefixedKey = this.getPrefixedKey(key)
        Cookies.set(prefixedKey, value, {...options, secure: true})
    }
    get(key: string) {
        const prefixedKey = this.getPrefixedKey(key)
        return Cookies.get(prefixedKey) || ''
    }
    delete(key: string) {
        const prefixedKey = this.getPrefixedKey(key)
        Cookies.remove(prefixedKey)
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
        const prefixedKey = this.getPrefixedKey(key)
        const oldValue = this.get(prefixedKey)
        window.localStorage.setItem(prefixedKey, value)
        const event = new StorageEvent('storage', {
            key: prefixedKey,
            oldValue: oldValue,
            newValue: value
        })
        window.dispatchEvent(event)
    }
    get(key: string) {
        const prefixedKey = this.getPrefixedKey(key)
        return window.localStorage.getItem(prefixedKey) || ''
    }
    delete(key: string) {
        const prefixedKey = this.getPrefixedKey(key)
        const oldValue = this.get(prefixedKey)
        window.localStorage.removeItem(prefixedKey)
        const event = new StorageEvent('storage', {
            key: prefixedKey,
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
        const prefixedKey = this.getPrefixedKey(key)
        this.map.set(prefixedKey, value)
    }
    get(key: string) {
        const prefixedKey = this.getPrefixedKey(key)
        return this.map.get(prefixedKey) || ''
    }
    delete(key: string) {
        const prefixedKey = this.getPrefixedKey(key)
        this.map.delete(prefixedKey)
    }
}
