/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    kebabToLowerCamelCase,
    kebabToUpperCamelCase,
    expand,
    getConfiguredExtensions
} from './helpers'

describe('kebabToLowerCamelCase', () => {
    test('converts a simple kebab-case string to lowerCamelCase', () => {
        expect(kebabToLowerCamelCase('hello-world')).toBe('helloWorld')
    })

    test('converts a multi-word kebab-case string to lowerCamelCase', () => {
        expect(kebabToLowerCamelCase('foo-bar-baz')).toBe('fooBarBaz')
    })

    test('handles a single word without hyphens', () => {
        expect(kebabToLowerCamelCase('hello')).toBe('hello')
    })

    test('handles an empty string', () => {
        expect(kebabToLowerCamelCase('')).toBe('')
    })

    test('converts strings with multiple consecutive hyphens', () => {
        expect(kebabToLowerCamelCase('foo--bar--baz')).toBe('fooBarBaz')
    })

    test('converts strings with uppercase characters correctly', () => {
        expect(kebabToLowerCamelCase('HELLO-WORLD')).toBe('helloWorld')
    })

    test('converts strings with mixed case correctly', () => {
        expect(kebabToLowerCamelCase('fOo-BaR-bAz')).toBe('fooBarBaz')
    })

    test('handles strings that start or end with hyphens', () => {
        expect(kebabToLowerCamelCase('-foo-bar-')).toBe('FooBar')
    })
})

describe('kebabToUpperCamelCase', () => {
    test('converts a simple kebab-case string to UpperCamelCase', () => {
        expect(kebabToUpperCamelCase('hello-world')).toBe('HelloWorld')
    })

    test('converts a multi-word kebab-case string to UpperCamelCase', () => {
        expect(kebabToUpperCamelCase('foo-bar-baz')).toBe('FooBarBaz')
    })

    test('handles a single word without hyphens', () => {
        expect(kebabToUpperCamelCase('hello')).toBe('Hello')
    })

    test('handles an empty string', () => {
        expect(kebabToUpperCamelCase('')).toBe('')
    })

    test('converts strings with multiple consecutive hyphens', () => {
        expect(kebabToUpperCamelCase('foo--bar--baz')).toBe('FooBarBaz')
    })

    test('converts strings with uppercase characters correctly', () => {
        expect(kebabToUpperCamelCase('HELLO-WORLD')).toBe('HelloWorld')
    })

    test('converts strings with mixed case correctly', () => {
        expect(kebabToUpperCamelCase('fOo-BaR-bAz')).toBe('FooBarBaz')
    })

    test('handles strings that start or end with hyphens', () => {
        expect(kebabToUpperCamelCase('-foo-bar-')).toBe('FooBar')
    })
})

describe('"expand" util returns correct return value when', () => {
    ;[
        {
            name: 'extensions are all valid package names',
            input: ['store-locator', 'product-details', 'checkout', '@salesforce/commerce-api'],
            expected: [
                ['store-locator', {enabled: true}],
                ['product-details', {enabled: true}],
                ['checkout', {enabled: true}],
                ['@salesforce/commerce-api', {enabled: true}]
            ]
        },
        {
            name: 'extensions include falsy values',
            input: ['store-locator', '', false],
            expected: [['store-locator', {enabled: true}]]
        },
        {
            name: 'extensions can have any valid package name (no naming restrictions)',
            input: ['my-extension', 'not-a-store', 'simple-name'],
            expected: [
                ['my-extension', {enabled: true}],
                ['not-a-store', {enabled: true}],
                ['simple-name', {enabled: true}]
            ]
        },
        {
            name: 'extensions have mixed formats',
            input: [
                '@salesforce/commerce-api',
                ['@salesforce/analytics', {foo: 'bar'}],
                ['@salesforce/payment-gateway']
            ],
            expected: [
                ['@salesforce/commerce-api', {enabled: true}],
                ['@salesforce/analytics', {enabled: true, foo: 'bar'}],
                ['@salesforce/payment-gateway', {enabled: true}]
            ]
        }
    ].forEach((testCase) => {
        test(`${testCase.name}`, () => {
            const result = expand(testCase.input)

            expect(result).toEqual(testCase.expected)
        })
    })
})

describe('getConfiguredExtensions', () => {
    test('parses the given config and normalizes the list', () => {
        const extensions = getConfiguredExtensions({
            app: {
                extensions: [
                    '@salesforce/store-locator',
                    ['@salesforce/product-details', {foo: 'bar'}]
                ]
            }
        })
        const firstExtension = extensions[0]
        const secondExtension = extensions[1]

        expect(Array.isArray(firstExtension)).toBe(true)
        expect(firstExtension[0]).toBe('@salesforce/store-locator')
        expect(secondExtension[0]).toBe('@salesforce/product-details')
    })

    test('returns empty array for config without extensions', () => {
        const extensions = getConfiguredExtensions({app: {}})
        expect(Array.isArray(extensions) && extensions.length === 0).toBe(true)
    })
})
