/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Minimal stub version of ssr-proxying utilities for pwa-kit-dev
 * This breaks the cyclical dependency with pwa-kit-runtime
 * @private
 */

export const X_MOBIFY_REQUEST_CLASS = 'x-mobify-request-class'
export const X_PROXY_REQUEST_URL = 'x-proxy-request-url'

export class Headers {
    constructor() {
        this.headers = new Map()
    }

    set(name, value) {
        this.headers.set(name.toLowerCase(), value)
    }

    get(name) {
        return this.headers.get(name.toLowerCase())
    }

    has(name) {
        return this.headers.has(name.toLowerCase())
    }

    delete(name) {
        this.headers.delete(name.toLowerCase())
    }

    forEach(callback) {
        this.headers.forEach(callback)
    }
}

export const X_HEADERS_TO_REMOVE_ORIGIN = [
    'x-mobify-request-class',
    'x-proxy-request-url'
] 