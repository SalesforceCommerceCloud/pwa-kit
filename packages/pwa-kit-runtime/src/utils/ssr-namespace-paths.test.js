/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getEnvBasePath, getProxyPath, getBundlePath} from './ssr-namespace-paths'
import {getConfig} from './ssr-config'

jest.mock('./ssr-config', () => {
    return {
        getConfig: jest.fn()
    }
})

const mockConfig = {
    envBasePath: '/test'
}

describe('environment base path tests', () => {
    beforeEach(() => {
        jest.resetModules()
        jest.resetAllMocks()
    })

    test('basePath is returned from config', () => {
        getConfig.mockImplementation(() => mockConfig)
        expect(getEnvBasePath()).toBe('/test')
    })

    test('basePath is included in proxy path', () => {
        getConfig.mockImplementation(() => mockConfig)
        expect(getProxyPath()).toBe('/test/mobify/proxy')
    })

    test('basePath is included in bundle path', () => {
        getConfig.mockImplementation(() => mockConfig)
        expect(getBundlePath()).toBe('/test/mobify/bundle')
    })

    test('basePath is set to empty string if there is no config', () => {
        getConfig.mockImplementation(() => {})
        expect(getEnvBasePath()).toBe('')
    })

    test('basePath is set to empty string if envBasePath is not a string', () => {
        getConfig.mockImplementation(() => {
            return {
                envBasePath: () => {}
            }
        })
        expect(getEnvBasePath()).toBe('')
    })
})
