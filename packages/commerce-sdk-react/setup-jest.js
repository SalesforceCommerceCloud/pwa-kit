/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import '@testing-library/jest-dom'
import {configure} from '@testing-library/dom'
import nock from 'nock'

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

const localStorageMock = new LocalStorageMock()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

global.beforeAll(() => {
    // disable all real http requests
    nock.disableNetConnect()
    nock.emitter.on('no match', (req) => {
        throw Error(
            `\n\n\nYOUR TEST IS MAKING A REAL HTTP REQUEST. THIS IS A PROBLEM! PLEASE MOCK ALL HTTP CALLS\n\n\n `
        )
    })
})

global.afterEach(() => {
    nock.cleanAll()
})
