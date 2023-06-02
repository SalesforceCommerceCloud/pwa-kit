/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import '@testing-library/jest-dom'
import nock from 'nock'

// set jsdom in https context to allow read/write secure cookies
global.jsdom.reconfigure({url: 'https://www.domain.com'})

class LocalStorageMock {
    constructor() {
        this.store = {}
    }
    clear() {
        this.store = {}
    }
    getItem(key) {
        return this.store[key] || null
    }
    setItem(key, value) {
        this.store[key] = value?.toString()
    }
    removeItem(key) {
        delete this.store[key]
    }
}

/* eslint-disable @typescript-eslint/no-var-requires */
global.TextDecoder = require('util').TextDecoder

const localStorageMock = new LocalStorageMock()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

global.afterEach(() => {
    nock.cleanAll()
})
