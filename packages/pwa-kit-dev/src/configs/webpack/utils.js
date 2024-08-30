/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'

export const makeRegExp = (str, sep = path.sep) => {
    // Replace unix paths with windows if needed and build a RegExp
    if (sep === '\\') {
        str = str.replace(/\//g, '\\\\')
    }
    return new RegExp(str)
}

/**
 * Converts a kebab-case string to UpperCamelCase (PascalCase).
 *
 * @param {string} str - The kebab-case string to be converted.
 * @returns {string} The converted UpperCamelCase string.
 *
 * @example
 * // Returns 'HelloWorld'
 * kebabToUpperCamelCase('hello-world')
 *
 * @example
 * // Returns 'FooBarBaz'
 * kebabToUpperCamelCase('foo-bar-baz')
 */
export const kebabToUpperCamelCase = (str) =>
    str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')

/**
 * Converts a kebab-case string to lowerCamelCase.
 *
 * The first word in the resulting string will be in lower case, and each subsequent word will start with an uppercase letter.
 *
 * @param {string} str - The kebab-case string to be converted.
 * @returns {string} The converted lowerCamelCase string.
 *
 * @example
 * // Returns 'helloWorld'
 * kebabToLowerCamelCase('hello-world')
 *
 * @example
 * // Returns 'fooBarBaz'
 * kebabToLowerCamelCase('foo-bar-baz')
 */
export const kebabToLowerCamelCase = (str) =>
    str
        .split('-')
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('')
