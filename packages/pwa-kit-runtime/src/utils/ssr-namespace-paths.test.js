/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getEnvBasePath} from './ssr-namespace-paths'

describe('ssr-namespace-paths tests', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.resetModules()
        process.env = {...originalEnv}
        delete process.env.MRT_ENV_BASE_PATH
        // Ensure we're in Node environment (no window)
        delete global.window
    })

    afterEach(() => {
        process.env = originalEnv
        delete global.window
    })

    describe('Node environment (process.env)', () => {
        test('getEnvBasePath returns base path from environment variable', () => {
            process.env.MRT_ENV_BASE_PATH = '/sample'
            expect(getEnvBasePath()).toBe('/sample')
        })

        test('getEnvBasePath returns empty string if no base path is set', () => {
            expect(getEnvBasePath()).toBe('')
        })

        test('getEnvBasePath returns empty string if envBasePath is not a string', () => {
            process.env.MRT_ENV_BASE_PATH = 123
            expect(getEnvBasePath()).toBe('')
        })

        test('getEnvBasePath removes trailing slash', () => {
            process.env.MRT_ENV_BASE_PATH = '/sample/'
            expect(getEnvBasePath()).toBe('/sample')
        })

        test('getEnvBasePath returns empty string if invalid characters are detected in envBasePath', () => {
            process.env.MRT_ENV_BASE_PATH = '/sample.*'
            expect(getEnvBasePath()).toBe('')
        })

        test('getEnvBasePath normalizes envBasePath', () => {
            process.env.MRT_ENV_BASE_PATH = '  //sample/  '
            expect(getEnvBasePath()).toBe('/sample')
        })

        test('getEnvBasePath works with multiple part base path', () => {
            process.env.MRT_ENV_BASE_PATH = '//test/sample/  '
            expect(getEnvBasePath()).toBe('/test/sample')
        })
    })

    describe('Browser environment (window)', () => {
        beforeEach(() => {
            global.window = {}
        })

        test('getEnvBasePath returns base path from window global', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '/sample'
            expect(getEnvBasePath()).toBe('/sample')
        })

        test('getEnvBasePath returns empty string if window global is not set', () => {
            expect(getEnvBasePath()).toBe('')
        })

        test('getEnvBasePath removes trailing slash from window global', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '/sample/'
            expect(getEnvBasePath()).toBe('/sample')
        })

        test('getEnvBasePath normalizes window global value', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '  //sample/  '
            expect(getEnvBasePath()).toBe('/sample')
        })

        test('getEnvBasePath returns empty string if invalid characters in window global', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '/sample.*'
            expect(getEnvBasePath()).toBe('')
        })
    })
})
