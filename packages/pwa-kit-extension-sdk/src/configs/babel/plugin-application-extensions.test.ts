/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as babel from '@babel/core'
import {renderTemplate} from '../utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const replaceExtensionsPlaceholderContentPlugin = require('./plugin-application-extensions')

// Mock the utilities used in the plugin
jest.mock('../utils', () => ({
    renderTemplate: jest.fn()
}))

jest.mock('../../shared/utils', () => {
    const origin = jest.requireActual('../../shared/utils')
    return {
        ...origin,
        mergeWithDefaultConfig: jest.fn()
    }
})

describe('replaceExtensionsPlaceholderContentPlugin', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const transformCode = (code: string, options: any) => {
        return babel.transform(code, {
            filename: '../express/placeholders/application-extensions.js', // Replace with the path matching `fileToReplace`
            plugins: [[replaceExtensionsPlaceholderContentPlugin, options]],
            configFile: false,
            babelrc: false
        })
    }

    test('replaces file content if path matches fileToReplace', () => {
        // Mock `renderTemplate` to return specific content
        ;(renderTemplate as jest.Mock).mockReturnValue(`export const example = 'New Content';`)

        const code = `export const oldExample = 'Old Content'`
        const options = {
            installed: ['extension-test'],
            configured: ['extension-test'],
            target: 'web'
        }
        const result = transformCode(code, options)

        // Check if the original content is replaced with new content from renderTemplate
        expect(result?.code).toContain(`var example = exports.example = 'New Content';`)
        expect(result?.code).not.toContain(`export const oldExample = 'Old Content'`)
    })

    test('does not replace content if file has already been processed', () => {
        // Mock `renderTemplate` to return specific content
        ;(renderTemplate as jest.Mock).mockReturnValue(`export const example = 'New Content';`)

        const filePath = '../express/placeholders/application-extensions.js'
        const options = {
            installed: ['extension-test'],
            configured: ['extension-test'],
            target: 'web'
        }

        // First pass: Should replace content
        transformCode(`export const example = 'Initial Content';`, options)

        // Second pass: Should skip processing due to already being processed
        const result = babel.transform(`export const example = 'Should not change';`, {
            filename: filePath,
            plugins: [[replaceExtensionsPlaceholderContentPlugin, options]],
            configFile: false,
            babelrc: false
        })

        // Verify content is not changed again
        expect(result?.code).toContain(`export const example = 'Should not change'`)
        expect(result?.code).not.toContain(`export const example = 'New Content';`)
    })

    test('throws an error if new content cannot be parsed', () => {
        // Mock renderTemplate to return invalid syntax
        ;(renderTemplate as jest.Mock).mockReturnValue(`<.@invalid syntax here`)

        const options = {
            installed: ['extension-test'],
            configured: ['extension-test'],
            target: 'web'
        }

        expect(() => {
            // Use new babel.transform call so we can specify the new file name that isn't cached.
            babel.transform(`export const example = 'Should not change';`, {
                filename: '../folder2/express/placeholders/application-extensions.js',
                plugins: [[replaceExtensionsPlaceholderContentPlugin, options]],
                configFile: false,
                babelrc: false
            })
        }).toThrow('Failed to parse content')
    })
})
