/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {kebabToLowerCamelCase, kebabToUpperCamelCase} from './utils'

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
