/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {resolve} from 'path'
import fse from 'fs-extra'

// Local
import {expand} from './resolver-utils'
import {nameRegex} from './extensibility-utils'

// Re-exports
export * from './extensibility-utils'
export * from './resolver-utils'

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

export const getApplicationExtensionInfo = (appConfig?: any) => {
    const projectDir = process.cwd()
    const pkg = fse.readJsonSync(resolve(projectDir, 'package.json'))

    // Use the application configuration in the projects application if one isn't provided.
    appConfig = appConfig
        ? appConfig
        : fse.readJsonSync(resolve(projectDir, 'package.json'))?.mobify || {}

    const installedExtensions = Object.keys(pkg?.devDependencies || {})
        .map((packageName) => (packageName.match(nameRegex) !== null ? packageName : undefined))
        .filter(Boolean)

    // NOTE: Might have to get the expanded version of these.
    const configuredExtensions = expand(appConfig?.app?.extensions || [])

    return {
        installed: installedExtensions,
        configured: configuredExtensions
    }
}
