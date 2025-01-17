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
            input: ['extension-a', 'extension-b', 'extension-c', '@salesforce/extension-d'],
            expected: [
                ['extension-a', {enabled: true}],
                ['extension-b', {enabled: true}],
                ['extension-c', {enabled: true}],
                ['@salesforce/extension-d', {enabled: true}]
            ]
        },
        {
            name: 'extensions include falsy values',
            input: ['extension-a', '', false],
            expected: [['extension-a', {enabled: true}]]
        },
        {
            name: 'extensions defined do not follow naming convention',
            input: ['not-the-correct-prefix-a'],
            expected: []
        },
        {
            name: 'extensions have mixed formats',
            input: [
                '@salesforce/extension-a',
                ['@salesforce/extension-b', {foo: 'bar'}],
                ['@salesforce/extension-c']
            ],
            expected: [
                ['@salesforce/extension-a', {enabled: true}],
                ['@salesforce/extension-b', {enabled: true, foo: 'bar'}],
                ['@salesforce/extension-c', {enabled: true}]
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
                    '@salesforce/extension-test',
                    ['@salesforce/extension-test-2', {foo: 'bar'}]
                ]
            }
        })
        const firstExtension = extensions[0]
        const secondExtension = extensions[1]

        expect(Array.isArray(firstExtension)).toBe(true)
        expect(firstExtension[0]).toBe('@salesforce/extension-test')
        expect(secondExtension[0]).toBe('@salesforce/extension-test-2')
    })

    test('returns empty array for config without extensions', () => {
        const extensions = getConfiguredExtensions({app: {}})
        expect(Array.isArray(extensions) && extensions.length === 0).toBe(true)
    })
})
