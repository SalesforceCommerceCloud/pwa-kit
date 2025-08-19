/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getEnvBasePath} from './ssr-namespace-paths'
import * as ssrConfig from './ssr-config'

jest.mock('./ssr-config')

describe('ssr-namespace-paths tests', () => {
    test('getEnvBasePath returns base path from config', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({envBasePath: '/sample'})
        expect(getEnvBasePath()).toBe('/sample')
    })

    test('getEnvBasePath returns empty string if no base path is set', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({})
        expect(getEnvBasePath()).toBe('')
    })

    test('getEnvBasePath returns empty string if envBasePath is not a string', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({envBasePath: 123})
        expect(getEnvBasePath()).toBe('')
    })

    test('getEnvBasePath removes trailing slash', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({envBasePath: '/sample/'})
        expect(getEnvBasePath()).toBe('/sample')
    })

    test('getEnvBasePath escapes regex characters', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({envBasePath: '/sample.*'})
        expect(getEnvBasePath()).toBe('/sample\\.\\*')
    })

    test('getEnvBasePath escapes multiple regex characters', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({
            envBasePath: '/path/with[special]chars'
        })
        expect(getEnvBasePath()).toBe('/path/with\\[special\\]chars')
    })

    test('getEnvBasePath escapes regex characters and removes trailing slash', () => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({envBasePath: '/sample.*/'})
        expect(getEnvBasePath()).toBe('/sample\\.\\*')
    })
})
