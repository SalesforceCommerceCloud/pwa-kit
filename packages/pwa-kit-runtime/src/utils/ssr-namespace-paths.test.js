/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    proxyBasePath,
    bundleBasePath,
    cachingBasePath,
    healthCheckPath,
    slasPrivateProxyPath,
    ssrNamespace
} from './ssr-namespace-paths'

describe('ssr-namespace-paths tests', () => {
    test('proxyBasePath is correctly set', () => {
        expect(proxyBasePath).toBe('/mobify/proxy')
    })

    test('bundleBasePath is correctly set', () => {
        expect(bundleBasePath).toBe('/mobify/bundle')
    })

    test('cachingBasePath is correctly set', () => {
        expect(cachingBasePath).toBe('/mobify/caching')
    })

    test('healthCheckPath is correctly set', () => {
        expect(healthCheckPath).toBe('/mobify/ping')
    })

    test('slasPrivateProxyPath is correctly set', () => {
        expect(slasPrivateProxyPath).toBe('/mobify/slas/private')
    })

    test('ssrNamespace is an empty string', () => {
        expect(ssrNamespace).toBe('')
    })
})
