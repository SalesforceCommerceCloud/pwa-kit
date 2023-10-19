/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {BaseStorageOptions, BaseStorage} from './base'

export interface MemoryStorageOptions extends BaseStorageOptions {
    sharedContext?: boolean
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
