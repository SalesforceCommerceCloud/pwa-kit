/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ApplicationExtensionEntryArray, ApplicationExtensionConfig} from '../../types'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// NOTE: please make sure that the imported modules do not include 'path'.
// This way getConfiguredExtensions can be called from both server and client side.

const DEFAULT_CONFIG: ApplicationExtensionConfig = {
    enabled: true
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
export const kebabToUpperCamelCase = (str: string) =>
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
export const kebabToLowerCamelCase = (str: string) =>
    str
        .split('-')
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('')

// Returns true if the entry passes is a ApplicationExtensionEntryArray type.
// TODO: This looks like it could be done in a more generic way.
const isApplicationExtensionEntryArray = (entry: unknown[]): boolean => {
    const [nameRef, config] = entry || []
    const isValid =
        typeof nameRef === 'string' &&
        typeof config === 'object' &&
        !!nameRef.match(/^(?:@([^/]+)\/)?extension-(.+)$/)

    if (!isValid) {
        // TODO: use our logger factory
        console.warn(
            'Skipping this application extension entry because it is not of valid format. Please double check your configuration.',
            entry
        )
    }

    return isValid
}

/**
 * Normalize and expand the extension configuration array so that it is easier to process.
 * @param extensions - The extensions configuration value as defined in the PWA-Kit config.
 * @returns a list of extensions all in tuple format
 *
 * @example
 * const result = expand([
 *   '@salesforce/extension-a',
 *   ['@salesforce/extension-b', {foo: 'bar'}],
 *   ['@salesforce/extension-c']
 * ]);
 * console.log(result)
 * [
 *   ['@salesforce/extension-a', {enabled: true}],
 *   ['@salesforce/extension-b', {enabled: true, foo: 'bar'}],
 *   ['@salesforce/extension-c', {enabled: true}]
 * ]
 */
export const expand = (extensions: unknown[] = []): ApplicationExtensionEntryArray[] =>
    extensions
        .filter((extension) => Boolean(extension))
        .map((extension) => {
            const tuple: [string, any] = Array.isArray(extension)
                ? [extension[0], {...DEFAULT_CONFIG, ...extension[1]}]
                : [extension, DEFAULT_CONFIG]

            return tuple
        })
        .filter(isApplicationExtensionEntryArray)

/**
 * Returns the list of configured extensions, given the configurations found in a config file or package.json's `mobify`
 * @example
 * import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
 * getConfiguredExtensions(getConfig())
 */
export const getConfiguredExtensions = (
    config: any = getConfig()
): ApplicationExtensionEntryArray[] => {
    // Note: this path to the `extensions` property may change
    return expand(config?.app?.extensions || [])
}
