/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getEnvBasePath, getProxyPath, getBundlePath} from './ssr-namespace-paths'

const mockConfig = {
    envBasePath: '/test'
}

jest.mock('./ssr-config', () => {
    return {
        getConfig: () => mockConfig
    }
})

describe('environment base path tests', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    test('basePath is returned from config', () => {
        expect(getEnvBasePath()).toBe('/test')
    })

    test('basePath is included in proxy path', () => {
        expect(getProxyPath()).toBe('/test/mobify/proxy')
    })

    test('basePath is included in bundle path', () => {
        expect(getBundlePath()).toBe('/test/mobify/bundle')
    })
})
