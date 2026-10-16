/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getLocalCommerceClientAssetOrigin,
    getLocalCommerceClientCspSources,
    isLoopbackHostname
} from '@salesforce/retail-react-app/app/utils/commerce-client-security'

describe('Commerce Client security policy', () => {
    const localConfig = {
        commerceClientScriptSourceUrl: 'http://localhost:4173/messaging.umd.js'
    }

    test('resolves an explicitly configured local script to its exact development origin', () => {
        expect(
            getLocalCommerceClientAssetOrigin(
                localConfig.commerceClientScriptSourceUrl,
                'development'
            )
        ).toBe('http://localhost:4173')
    })

    test.each(['production', 'test', undefined])(
        'rejects local assets when NODE_ENV is %s',
        (nodeEnv) => {
            expect(
                getLocalCommerceClientAssetOrigin(
                    localConfig.commerceClientScriptSourceUrl,
                    nodeEnv
                )
            ).toBeNull()
        }
    )

    test('returns only the configured local origin for CSP', () => {
        expect(getLocalCommerceClientCspSources(localConfig, 'development')).toEqual([
            'http://localhost:4173'
        ])
        expect(getLocalCommerceClientCspSources(localConfig, 'production')).toEqual([])
        expect(getLocalCommerceClientCspSources({}, 'development')).toEqual([])
    })

    test('rejects non-web protocols and non-local origins', () => {
        expect(
            getLocalCommerceClientAssetOrigin('ftp://localhost/widget.js', 'development')
        ).toBeNull()
        expect(
            getLocalCommerceClientAssetOrigin('https://example.com/widget.js', 'development')
        ).toBeNull()
        expect(getLocalCommerceClientAssetOrigin('not-a-url', 'development')).toBeNull()
    })

    test('recognizes only the supported loopback hostnames', () => {
        expect(isLoopbackHostname('localhost')).toBe(true)
        expect(isLoopbackHostname('127.0.0.1')).toBe(true)
        expect(isLoopbackHostname('localhost.example.com')).toBe(false)
        expect(isLoopbackHostname('::1')).toBe(false)
    })
})
