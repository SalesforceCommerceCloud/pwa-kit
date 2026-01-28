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

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config')
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths')

describe('getProxyConfigs (server-side)', () => {
    test('should return the currently used proxy configs', () => {
        expect(utils.getProxyConfigs()).toEqual(proxyConfigs)
    })
})

describe('getBasename (server-side)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return basename when showBasename is true', () => {
        const mockBasename = '/test-base'
        getEnvBasePath.mockReturnValue(mockBasename)
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasename: true
                }
            }
        })

        expect(utils.getBasename()).toBe(mockBasename)
    })

    test('should return empty string when showBasename is undefined', () => {
        getConfig.mockReturnValue({
            app: {
                url: {}
            }
        })

        expect(utils.getBasename()).toBe('')
    })

    test('should return empty string when showBasename is false', () => {
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasename: false
                }
            }
        })

        expect(utils.getBasename()).toBe('')
    })

    test('should return empty string when app config is missing', () => {
        getConfig.mockReturnValue({})

        expect(utils.getBasename()).toBe('')
    })
})
