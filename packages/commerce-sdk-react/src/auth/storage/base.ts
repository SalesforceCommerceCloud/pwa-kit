/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export interface BaseStorageOptions {
    keySuffix?: string
}

export abstract class BaseStorage {
    static available = true
    protected options: BaseStorageOptions = {}

    constructor(options?: BaseStorageOptions) {
        if (!new.target.available) {
            throw new Error(`${new.target.name} is not available on the current environment.`)
        }
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
