/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './ssr-config.client'

describe('Client getConfig', () => {
    const originalWindow = global.window
    const originalDocument = global.document

    beforeEach(() => {
        global.window = {}
        global.document = {
            getElementById: jest.fn()
        }
    })

    afterEach(() => {
        global.window = originalWindow
        global.document = originalDocument
    })

    test('returns window.__CONFIG__ value', () => {
        global.window.__CONFIG__ = {}
        expect(getConfig()).toEqual({})
    })

    test('parses config from mobify-data element when window.__CONFIG__ is not available', () => {
        const mockConfig = {key: 'value'}
        const mockInnerHTML = JSON.stringify({__CONFIG__: mockConfig})

        global.window.__CONFIG__ = undefined
        global.document.getElementById = jest.fn().mockReturnValue({innerHTML: mockInnerHTML})

        expect(getConfig()).toEqual(mockConfig)
    })

    test('handles JSON parsing error', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

        global.window.__CONFIG__ = undefined

        global.document.getElementById.mockReturnValue({innerHTML: '{{{'})

        expect(getConfig()).toBeUndefined()
        expect(consoleSpy).toHaveBeenCalledTimes(2)
        expect(consoleSpy).toHaveBeenCalledWith('Unable to parse server-side rendered config.')

        consoleSpy.mockRestore()
    })
})
