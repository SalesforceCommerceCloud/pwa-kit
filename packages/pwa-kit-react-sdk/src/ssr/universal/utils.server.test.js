/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Jest requires the @jest-environment comment at the start of file, which
// conflicts with the eslint header rule.
/* eslint-disable header/header */

import * as utils from './utils'
import {proxyConfigs} from '@salesforce/pwa-kit-runtime/utils/ssr-shared'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths', () => ({
    getEnvBasePath: jest.fn()
}))

describe('getProxyConfigs (server-side)', () => {
    test('should return the currently used proxy configs', () => {
        expect(utils.getProxyConfigs()).toEqual(proxyConfigs)
    })
})

describe('getRouterBasePath (server-side)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return base path when showBasePath is true', () => {
        const mockBasePath = '/test-base'
        getEnvBasePath.mockReturnValue(mockBasePath)
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasePath: true
                }
            }
        })

        expect(utils.getRouterBasePath()).toBe(mockBasePath)
    })

    test('should return empty string when showBasePath is undefined', () => {
        getConfig.mockReturnValue({
            app: {
                url: {}
            }
        })

        expect(utils.getRouterBasePath()).toBe('')
    })

    test('should return empty string when showBasePath is false', () => {
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasePath: false
                }
            }
        })

        expect(utils.getRouterBasePath()).toBe('')
    })

    test('should return empty string when app config is missing', () => {
        getConfig.mockReturnValue({})

        expect(utils.getRouterBasePath()).toBe('')
    })
})
