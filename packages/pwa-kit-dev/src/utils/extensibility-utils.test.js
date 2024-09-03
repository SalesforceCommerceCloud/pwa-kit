/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs-extra'
import path from 'path'

import * as extensionUtils from './extensibility-utils'

describe('extensibilityUtils', () => {
    const existingTSFile = path.join('mocked', 'path', 'exists.ts')
    const existingJSFile = path.join('mocked', 'path', 'exists.js')
    const existingFileWithoutExtension = path.join('mocked', 'path', 'exists')
    const missingFileWithoutExtension = path.join('mocked', 'path', 'does-not-exists')

    beforeAll(() => {
        const spy = jest.spyOn(fs, 'existsSync')

        spy.mockImplementation((filePath) => {
            if (filePath === existingJSFile) {
                return true
            }

            if (filePath === existingTSFile) {
                return true
            }

            if (
                filePath ===
                path.join(process.cwd(), 'node_modules', '@extension-good', 'src', 'setup-app.ts')
            ) {
                return true
            }

            return null
        })
    })

    describe('"findFileWithExtension" correctly', () => {
        ;[
            {
                name: 'returns null if path exists but no files no files with provided file extensions.',
                path: existingFileWithoutExtension,
                fileExtensions: ['.mjs'],
                expected: null
            },
            {
                name: 'returns path if file is found with provided extension.',
                path: existingFileWithoutExtension,
                fileExtensions: ['.js'],
                expected: existingJSFile
            },
            {
                name: 'returns path if file is found with mixed existing and non existing extensions.',
                path: existingFileWithoutExtension,
                fileExtensions: ['.mjs', '.ts'],
                expected: existingTSFile
            },
            {
                name: 'returns null if no file extensions are provided.',
                path: existingFileWithoutExtension,
                fileExtensions: undefined,
                expected: null
            },
            {
                name: 'returns null if no file extensions are provided.',
                path: missingFileWithoutExtension,
                fileExtensions: ['.js'],
                expected: null
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const {path, fileExtensions} = testCase
                const result = extensionUtils.findFileWithExtension(path, fileExtensions)

                expect(result).toEqual(testCase.expected)
            })
        })
    })

    describe('"buildAliases" correctly', () => {
        ;[
            {
                name: 'returns an empty object if undefined is passed',
                extensions: [],
                expected: {}
            },
            {
                name: 'returns an empty object if no application extensions are provided',
                extensions: [],
                expected: {}
            },
            {
                name: 'returns an defined object with correct mapping when application extensions are provided',
                extensions: ['@extension-good'],
                expected: {
                    '@extension-good/setup-app': path.join(
                        process.cwd(),
                        'node_modules',
                        '@extension-good',
                        'src',
                        'setup-app.ts'
                    )
                }
            },
            {
                name: 'returns an defined object with correct mapping when application extensions are provided including a bad extension',
                extensions: ['@extension-bad', '@extension-good'],
                expected: {
                    '@extension-good/setup-app': path.join(
                        process.cwd(),
                        'node_modules',
                        '@extension-good',
                        'src',
                        'setup-app.ts'
                    )
                }
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const {extensions} = testCase
                const result = extensionUtils.buildAliases(extensions)

                expect(result).toEqual(testCase.expected)
            })
        })
    })
})
