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

        test('getEnvBasePath throws error for base path with trailing slash', () => {
            process.env.MRT_ENV_BASE_PATH = '/sample/'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error for just a slash', () => {
            process.env.MRT_ENV_BASE_PATH = '/'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error if invalid characters are detected in envBasePath', () => {
            process.env.MRT_ENV_BASE_PATH = '/sample<script>'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error for envBasePath with whitespace', () => {
            process.env.MRT_ENV_BASE_PATH = '  /sample  '
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error for multi-part base paths with slashes', () => {
            process.env.MRT_ENV_BASE_PATH = '/test/sample'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath allows special characters: . + $ ~ " \' @ : -', () => {
            process.env.MRT_ENV_BASE_PATH = '/a.b+c$d~e"f\'g@h:i-j_k'
            expect(getEnvBasePath()).toBe('/a.b+c$d~e"f\'g@h:i-j_k')
        })

        test('getEnvBasePath throws error if base path exceeds 64 characters', () => {
            // 65 characters total (1 slash + 64 chars)
            process.env.MRT_ENV_BASE_PATH = '/' + 'a'.repeat(64)
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath allows base path of exactly 64 characters', () => {
            // 64 characters total (1 slash + 63 chars)
            process.env.MRT_ENV_BASE_PATH = '/' + 'a'.repeat(63)
            expect(getEnvBasePath()).toBe('/' + 'a'.repeat(63))
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

        test('getEnvBasePath throws error for base path with trailing slash from window global', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '/sample/'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error for window global value with whitespace', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '  /sample  '
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error if invalid characters in window global', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '/sample<script>'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })

        test('getEnvBasePath throws error for multi-part base paths in window global', () => {
            global.window.__MRT_ENV_BASE_PATH__ = '/test/sample'
            expect(() => getEnvBasePath()).toThrow('Invalid envBasePath configuration')
        })
    })
})
