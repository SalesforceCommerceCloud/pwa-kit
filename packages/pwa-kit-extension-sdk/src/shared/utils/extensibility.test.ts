/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fse from 'fs-extra'
import path from 'path'

import * as extensionUtils from './extensibility'

// Mock the fs-extra module
jest.mock('fs-extra')
const mockedFse = fse as jest.Mocked<typeof fse>

// Helper function to mock package.json structure
const mockPackageJson = (devDependencies: Record<string, string>, mobifyConfig?: any) => {
    mockedFse.readJsonSync.mockImplementation((filePath) => {
        if (filePath.toString().endsWith('package.json')) {
            return {
                devDependencies,
                mobify: mobifyConfig
            }
        }
        return {}
    })
}

describe('extensibilityUtils', () => {
    const existingTSFile = path.join('mocked', 'path', 'exists.ts')
    const existingJSFile = path.join('mocked', 'path', 'exists.js')
    const existingFileWithoutExtension = path.join('mocked', 'path', 'exists')
    const missingFileWithoutExtension = path.join('mocked', 'path', 'does-not-exists')

    beforeAll(() => {
        const spy = jest.spyOn(fse, 'existsSync')

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
            return false
        })
    })

    describe('findFileWithExtension', () => {
        interface TestCase {
            name: string
            path: string
            fileExtensions?: string[]
            expected: string | null
        }

        const testCases: TestCase[] = [
            {
                name: 'returns null if path exists but no files with provided file extensions.',
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
                name: 'returns path if file is found with mixed existing and non-existing extensions.',
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
                name: 'returns null if no file exists for the given extensions.',
                path: missingFileWithoutExtension,
                fileExtensions: ['.js'],
                expected: null
            }
        ]

        testCases.forEach(({name, path, fileExtensions, expected}) => {
            test(`${name}`, () => {
                const result = extensionUtils.findFileWithExtension(path, fileExtensions)
                expect(result).toEqual(expected)
            })
        })
    })

    describe('buildAliases', () => {
        interface AliasTestCase {
            name: string
            extensions?: string[]
            expected: Record<string, string>
        }

        const aliasTestCases: AliasTestCase[] = [
            {
                name: 'returns an empty object if undefined is passed',
                extensions: undefined,
                expected: {}
            },
            {
                name: 'returns an empty object if no application extensions are provided',
                extensions: [],
                expected: {}
            },
            {
                name: 'returns a defined object with correct mapping when one extension is provided',
                extensions: ['@extension-good'],
                expected: {
                    '@extension-good': path.join(
                        process.cwd(),
                        'node_modules',
                        '@extension-good',
                        'src'
                    )
                }
            },
            {
                name: 'returns defined objects with correct mapping when multiple extensions are provided',
                extensions: ['@extension-one', '@extension-two'],
                expected: {
                    '@extension-one': path.join(
                        process.cwd(),
                        'node_modules',
                        '@extension-one',
                        'src'
                    ),
                    '@extension-two': path.join(
                        process.cwd(),
                        'node_modules',
                        '@extension-two',
                        'src'
                    )
                }
            }
        ]

        aliasTestCases.forEach(({name, extensions, expected}) => {
            test(`${name}`, () => {
                const result = extensionUtils.buildAliases(extensions)
                expect(result).toEqual(expected)
            })
        })
    })

    describe('getApplicationExtensionInfo', () => {
        afterEach(() => {
            jest.clearAllMocks()
        })

        it('should return empty arrays if no devDependencies or mobify config', () => {
            mockPackageJson({})
            const result = extensionUtils.getApplicationExtensionInfo()
            expect(result).toEqual({installed: [], configured: []})
        })

        it('should return installed extensions based on devDependencies matching regex', () => {
            const devDependencies = {
                'extension-mock': '1.0.0',
                'not-an-extenion': '1.0.0'
            }
            mockPackageJson(devDependencies)

            const result = extensionUtils.getApplicationExtensionInfo()

            expect(result.installed).toEqual(['extension-mock'])
            expect(result.configured).toEqual([])
        })

        it('should return configured extensions from appConfig parameter', () => {
            const devDependencies = {}
            const appConfig = {app: {extensions: ['extension-from-app-config']}}
            mockPackageJson(devDependencies)

            const result = extensionUtils.getApplicationExtensionInfo(appConfig)

            expect(result.installed).toEqual([])
            expect(result.configured).toEqual([['extension-from-app-config', {enabled: true}]])
        })

        it('should use mobify config from package.json if appConfig is not provided', () => {
            const devDependencies = {}
            const mobifyConfig = {app: {extensions: ['extension-from-package-json']}}
            mockPackageJson(devDependencies, mobifyConfig)

            const result = extensionUtils.getApplicationExtensionInfo()

            expect(result.configured).toEqual([['extension-from-package-json', {enabled: true}]])
        })

        it('should prioritize appConfig parameter over package.json mobify config', () => {
            const devDependencies = {}
            const mobifyConfig = {app: {extensions: ['extension-old']}}
            const appConfig = {app: {extensions: ['extension-new']}}
            mockPackageJson(devDependencies, mobifyConfig)

            const result = extensionUtils.getApplicationExtensionInfo(appConfig)

            expect(result.configured).toEqual([['extension-new', {enabled: true}]])
        })
    })
})
