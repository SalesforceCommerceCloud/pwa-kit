/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './ssr-config.client'

let windowSpy

beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
})

afterEach(() => {
    windowSpy.mockRestore()
})

describe('Client getConfig', () => {
    test('returns window.__CONFIG__ value', () => {
        windowSpy.mockImplementation(() => ({
            __CONFIG__: {}
        }))

        expect(getConfig()).toEqual({})
    })
})
