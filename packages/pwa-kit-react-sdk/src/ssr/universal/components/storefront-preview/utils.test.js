/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getClientScript, getParentOrigin, detectStorefrontPreview} from './utils'

describe('getClientScript', function () {
    const oldWindow = window

    beforeEach(() => {
        window = {...oldWindow}
    })

    afterEach(() => {
        window = oldWindow
    })
    test('returns client script src with prod origin', () => {
        const src = getClientScript()
        expect(src).toEqual('https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js')
    })

    test('returns client script src with localhost origin', () => {
        // Delete the real properties from window so we can mock them
        delete window.parent

        window.parent = {}
        window.location.ancestorOrigins = ['http://localhost:4000']
        const src = getClientScript()

        expect(src).toEqual(
            'http://localhost:4000/mobify/bundle/development/static/storefront-preview.js'
        )
    })
})

describe('getParentOrigin', function () {
    test('returns origin from ancestorOrigins', () => {
        // Delete the real properties from window so we can mock them
        delete window.parent

        window.parent = {}
        const localHostOrigin = 'http://localhost:4000'
        window.location.ancestorOrigins = [localHostOrigin]
        const origin = getParentOrigin()

        expect(origin).toBe(localHostOrigin)
    })
    test('returns origin from document.referrer', () => {
        // Delete the real properties from window so we can mock them
        delete window.parent

        window.parent = {}
        delete window.location.ancestorOrigins
        const localHostOrigin = 'http://localhost:4000'
        jest.spyOn(document, 'referrer', 'get').mockReturnValue(localHostOrigin)
        const origin = getParentOrigin()

        expect(origin).toBe(localHostOrigin)
    })
})
describe('detectStorefrontPreview', function () {
    test('returns true for trusted origin', () => {
        // Delete the real properties from window so we can mock them
        delete window.parent
        delete window.location

        window.parent = {}
        window.location = {}
        window.location.hostname = 'localhost'
        const localHostOrigin = 'http://localhost:4000'
        window.location.ancestorOrigins = [localHostOrigin]
        expect(detectStorefrontPreview()).toBe(true)
    })
    test('returns false for non-trusted origin', () => {
        // Delete the real properties from window so we can mock them
        delete window.parent
        delete window.location

        window.parent = {}
        window.location = {}
        window.location.hostname = 'localhost'
        const localHostOrigin = 'http://localhost:4000'
        window.location.ancestorOrigins = [localHostOrigin]
        expect(detectStorefrontPreview()).toBe(true)
    })
})
