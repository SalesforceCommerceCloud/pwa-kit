/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    getCommerceClientOverridesCspSources,
    resolveCommerceClientOverrideOptions,
    validateOverridesUrl
} from '@salesforce/retail-react-app/app/utils/commerce-client-overrides'

describe('commerce-client-overrides', () => {
    describe('validateOverridesUrl', () => {
        test('accepts an HTTPS URL on any domain', () => {
            expect(validateOverridesUrl('https://cdn.example.com/overrides.js')).toBe(true)
        })

        test('rejects a non-HTTPS URL', () => {
            expect(validateOverridesUrl('http://cdn.example.com/overrides.js')).toBe(false)
        })

        test('rejects a malformed URL', () => {
            expect(validateOverridesUrl('not-a-url')).toBe(false)
            expect(validateOverridesUrl('')).toBe(false)
            expect(validateOverridesUrl(undefined)).toBe(false)
        })
    })

    describe('resolveCommerceClientOverrideOptions', () => {
        test('returns the inline map as overrides', () => {
            expect(
                resolveCommerceClientOverrideOptions({cc_overrides: {ProductTile: 'my-tile'}})
            ).toEqual({overrides: {ProductTile: 'my-tile'}})
        })

        test('returns the hosted script as overridesUrl', () => {
            expect(
                resolveCommerceClientOverrideOptions({
                    cc_overridesUrl: 'https://example.com/overrides.js'
                })
            ).toEqual({overridesUrl: 'https://example.com/overrides.js'})
        })

        test('prefers the inline map and drops the URL when both are set', () => {
            expect(
                resolveCommerceClientOverrideOptions({
                    cc_overrides: {ProductTile: 'my-tile'},
                    cc_overridesUrl: 'https://example.com/overrides.js'
                })
            ).toEqual({overrides: {ProductTile: 'my-tile'}})
        })

        test('falls back to the URL when the inline map is empty', () => {
            expect(
                resolveCommerceClientOverrideOptions({
                    cc_overrides: {},
                    cc_overridesUrl: 'https://example.com/overrides.js'
                })
            ).toEqual({overridesUrl: 'https://example.com/overrides.js'})
        })

        test('returns an empty object when neither is set', () => {
            expect(resolveCommerceClientOverrideOptions({})).toEqual({})
        })

        test('returns an empty object when called with no config', () => {
            expect(resolveCommerceClientOverrideOptions()).toEqual({})
        })

        test('drops a non-HTTPS URL instead of forwarding it', () => {
            expect(
                resolveCommerceClientOverrideOptions({
                    cc_overridesUrl: 'http://example.com/overrides.js'
                })
            ).toEqual({})
        })

        test('drops a malformed URL instead of forwarding it', () => {
            expect(resolveCommerceClientOverrideOptions({cc_overridesUrl: 'not-a-url'})).toEqual({})
        })

        test('still returns the inline map when the URL is invalid', () => {
            expect(
                resolveCommerceClientOverrideOptions({
                    cc_overrides: {ProductTile: 'my-tile'},
                    cc_overridesUrl: 'http://example.com/overrides.js'
                })
            ).toEqual({overrides: {ProductTile: 'my-tile'}})
        })
    })

    describe('getCommerceClientOverridesCspSources', () => {
        test('returns the origin of a valid HTTPS override URL', () => {
            expect(
                getCommerceClientOverridesCspSources({
                    cc_overridesUrl: 'https://cdn.example.com/path/overrides.js?v=2'
                })
            ).toEqual(['https://cdn.example.com'])
        })

        test('preserves a non-default port in the origin', () => {
            expect(
                getCommerceClientOverridesCspSources({
                    cc_overridesUrl: 'https://cdn.example.com:8443/overrides.js'
                })
            ).toEqual(['https://cdn.example.com:8443'])
        })

        test('returns no sources for a non-HTTPS URL', () => {
            expect(
                getCommerceClientOverridesCspSources({
                    cc_overridesUrl: 'http://cdn.example.com/overrides.js'
                })
            ).toEqual([])
        })

        test('returns no sources for a malformed URL', () => {
            expect(getCommerceClientOverridesCspSources({cc_overridesUrl: 'not-a-url'})).toEqual([])
        })

        test('returns no sources when an inline map wins over the URL', () => {
            expect(
                getCommerceClientOverridesCspSources({
                    cc_overrides: {ProductTile: 'my-tile'},
                    cc_overridesUrl: 'https://cdn.example.com/overrides.js'
                })
            ).toEqual([])
        })

        test('returns no sources when nothing is configured', () => {
            expect(getCommerceClientOverridesCspSources({})).toEqual([])
            expect(getCommerceClientOverridesCspSources()).toEqual([])
        })
    })
})
