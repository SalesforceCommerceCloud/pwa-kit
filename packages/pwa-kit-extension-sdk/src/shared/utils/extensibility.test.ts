/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fse from 'fs-extra'
import path from 'path'
import {PathLike} from 'fs'

import * as extensionUtils from './extensibility'

// Mock the fs-extra module
jest.mock('fs-extra')
const mockedFse = fse as jest.Mocked<typeof fse>

interface MockedPackageJSON {
    peerDependencies: Record<string, string>
    mobify?: any
}
// Helper function to mock package.json structure
const mockPackageJson = (opts: Record<string, MockedPackageJSON>) => {
    mockedFse.readJsonSync.mockImplementation((filePath) => {
        const found = Object.entries(opts).find(([packageName]) =>
            filePath.toString().endsWith(`${packageName}${path.sep}package.json`)
        )
        if (!found) return {}

        const [, value] = found
        return value
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

    describe('validateExtensionDependencies', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let originalIsExtensionPackage: typeof extensionUtils.isExtensionPackage

        beforeEach(() => {
            // Reset any mocks
            jest.restoreAllMocks()

            // Save the original function
            originalIsExtensionPackage = extensionUtils.isExtensionPackage

            // Mock isExtensionPackage function
            jest.spyOn(extensionUtils, 'isExtensionPackage').mockImplementation((packagePath) => {
                // Only consider packages with names containing the test packages as extensions
                const packageName = packagePath.toString().split('/').pop() || ''
                return ['my-extension', 'package-one', 'package-two'].includes(packageName)
            })

            // Mock existsSync - for extension metadata check
            mockedFse.existsSync.mockImplementation((filePath) => {
                // This simulates packages that have extension-meta.json
                const packageName = filePath.toString().split(path.sep).slice(-2)[0] || ''
                if (
                    filePath.toString().endsWith('extension-meta.json') &&
                    ['my-extension', 'package-one', 'package-two'].includes(packageName)
                ) {
                    return true
                }
                return false
            })
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('returns success if given an empty list of extensions', () => {
            const result = extensionUtils.validateExtensionDependencies([])
            expect(result).toStrictEqual({
                success: true
            })
        })

        test('returns success if the given extensions do NOT depend on other extensions', () => {
            mockPackageJson({
                'my-extension': {
                    peerDependencies: {
                        react: '^18.2.0'
                    }
                }
            })

            const result = extensionUtils.validateExtensionDependencies(['my-extension'])
            expect(result).toStrictEqual({
                success: true
            })
        })

        test('returns success if the given extensions do depend on other extensions and they are all loaded', () => {
            mockPackageJson({
                'package-one': {
                    peerDependencies: {
                        react: '^18.2.0'
                    }
                },
                'package-two': {
                    peerDependencies: {
                        react: '^18.2.0',
                        'package-one': '1.0.0'
                    }
                }
            })

            const result = extensionUtils.validateExtensionDependencies([
                'package-one',
                'package-two'
            ])
            expect(result).toStrictEqual({
                success: true
            })
        })

        test('returns failure if the given extensions do depend on other extensions and some are NOT loaded', () => {
            mockPackageJson({
                'package-one': {
                    peerDependencies: {
                        react: '^18.2.0'
                    }
                },
                'package-two': {
                    peerDependencies: {
                        react: '^18.2.0',
                        'package-one': '1.0.0'
                    }
                }
            })

            const result = extensionUtils.validateExtensionDependencies([
                ['package-one', {enabled: false}],
                'package-two'
            ])
            expect(result.success).toBe(false)
            expect(Array.isArray(result.errors) && result.errors.length > 0).toBe(true)
        })
    })

    describe('isExtensionPackage', () => {
        beforeEach(() => {
            // Reset mocks
            mockedFse.existsSync.mockReset()
        })

        test('returns true when extension-meta.json file exists in the package root', () => {
            // Create a more specific mock that checks exactly for the test paths
            mockedFse.existsSync.mockImplementation((filePath: PathLike) => {
                const pathStr = filePath.toString()

                // Handle the specific test cases we expect
                if (
                    pathStr === path.join('/path/to/standard-package', 'extension-meta.json') ||
                    pathStr ===
                        path.join('/path/to/@scoped/standard-package', 'extension-meta.json') ||
                    pathStr === path.join('/path/to/extension-old-naming', 'extension-meta.json')
                ) {
                    return true
                }

                return false
            })

            // Test with packages using different naming conventions
            expect(extensionUtils.isExtensionPackage('/path/to/standard-package')).toBe(true)
            expect(extensionUtils.isExtensionPackage('/path/to/@scoped/standard-package')).toBe(
                true
            )
            expect(extensionUtils.isExtensionPackage('/path/to/extension-old-naming')).toBe(true)
        })

        test('returns false when extension-meta.json file does not exist', () => {
            // Mock the existsSync to return false for all paths
            mockedFse.existsSync.mockReturnValue(false)

            expect(extensionUtils.isExtensionPackage('/path/to/non-extension-package')).toBe(false)
            expect(extensionUtils.isExtensionPackage('/path/to/extension-like-name')).toBe(false)
        })

        test('returns false when there is an error checking for extension-meta.json', () => {
            // Mock the existsSync to throw an error
            mockedFse.existsSync.mockImplementation(() => {
                throw new Error('Test error')
            })

            expect(extensionUtils.isExtensionPackage('/path/to/package')).toBe(false)
        })

        test('handles path with or without trailing slash', () => {
            // Mock existsSync for the specific test paths with and without trailing slash
            mockedFse.existsSync.mockImplementation((filePath: PathLike) => {
                const pathStr = filePath.toString()

                if (
                    pathStr === path.join('/path/to/package', 'extension-meta.json') ||
                    path.join('/path/to/package/', 'extension-meta.json').replace(/\/+/g, '/')
                ) {
                    return true
                }

                return false
            })

            expect(extensionUtils.isExtensionPackage('/path/to/package/')).toBe(true)
            expect(extensionUtils.isExtensionPackage('/path/to/package')).toBe(true)
        })
    })
})
