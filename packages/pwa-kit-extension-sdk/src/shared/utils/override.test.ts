/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import fse from 'fs-extra'
import glob from 'glob'
import * as overrideUtils from './override'

jest.mock('fs-extra')
jest.mock('glob', () => ({
    sync: jest.fn()
}))

describe('overrideUtils', () => {
    const mockProjectDir = process.cwd()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('parseOverridePath', () => {
        test('parses src override path correctly', () => {
            const overrideFile = path.join(
                mockProjectDir,
                'src',
                'overrides',
                'ext1',
                'components',
                'Button.tsx'
            )
            const expected = {
                extensionName: 'ext1',
                componentName: 'Button',
                componentPath: path.posix.join('components', 'Button')
            }
            const result = overrideUtils.parseOverridePath(overrideFile, mockProjectDir)
            expect(result).toEqual(expected)
        })

        test('parses app override path correctly', () => {
            const overrideFile = path.join(
                mockProjectDir,
                'app',
                'overrides',
                'ext2',
                'pages',
                'Home.tsx'
            )
            const expected = {
                extensionName: 'ext2',
                componentName: 'Home',
                componentPath: path.posix.join('pages', 'Home')
            }
            const result = overrideUtils.parseOverridePath(overrideFile, mockProjectDir)
            expect(result).toEqual(expected)
        })

        test('returns null for invalid path', () => {
            const overrideFile = path.join(mockProjectDir, 'invalid', 'path')
            const result = overrideUtils.parseOverridePath(overrideFile, mockProjectDir)
            expect(result).toBeNull()
        })
    })

    describe('isExtensionFile', () => {
        test('returns true for extension file path', () => {
            const filePath = path.join('node_modules', 'extension-test', 'src', 'file.ts')
            expect(overrideUtils.isExtensionFile(filePath)).toBe(true)
        })

        test('returns false for non-extension file path', () => {
            const filePath = path.join('src', 'components', 'file.ts')
            expect(overrideUtils.isExtensionFile(filePath)).toBe(false)
        })
    })

    describe('getOverridablePaths', () => {
        test('returns paths from .force_overrides file', () => {
            const mockContent = 'path1\npath2\n// comment\n\npath3'
            jest.spyOn(fse, 'readFileSync').mockReturnValue(mockContent)

            const result = overrideUtils.getOverridablePaths(mockProjectDir)
            expect(result).toEqual(['path1', 'path2', 'path3'])
        })

        test('returns empty array when file does not exist', () => {
            jest.spyOn(fse, 'readFileSync').mockImplementation(() => {
                throw new Error('File not found')
            })

            const result = overrideUtils.getOverridablePaths(mockProjectDir)
            expect(result).toEqual([])
        })
    })

    describe('normalizeSourcePath', () => {
        test('normalizes path for non-monorepo', () => {
            const sourcePath = path.join(
                'some',
                'path',
                'node_modules',
                'package',
                'src',
                'file.ts'
            )
            const result = overrideUtils.normalizeSourcePath(sourcePath, false)
            expect(result).toBe('./node_modules/package/src/file.ts')
        })

        test('normalizes path for monorepo', () => {
            const sourcePath = path.join('some', 'path', 'packages', 'package', 'src', 'file.ts')
            const result = overrideUtils.normalizeSourcePath(sourcePath, true)
            expect(result).toBe('./node_modules/@salesforce/package/src/file.ts')
        })

        test('handles path without node_modules or packages', () => {
            const sourcePath = path.join('some', 'path', 'file.ts')
            const result = overrideUtils.normalizeSourcePath(sourcePath, false)
            expect(result).toBe('./node_modules/some/path/file.ts')
        })
    })

    describe('findFiles', () => {
        test('returns matching files when directory exists', () => {
            const mockFiles = ['file1.ts', 'file2.tsx']
            jest.spyOn(fse, 'existsSync').mockReturnValue(true)
            jest.spyOn(glob, 'sync').mockReturnValue(mockFiles)

            const result = overrideUtils.findFiles('dir', ['.ts', '.tsx'])
            expect(result).toEqual(mockFiles)
        })

        test('returns empty array when directory does not exist', () => {
            jest.spyOn(fse, 'existsSync').mockReturnValue(false)

            const result = overrideUtils.findFiles('dir', ['.ts', '.tsx'])
            expect(result).toEqual([])
        })
    })

    describe('extractOverridableImports', () => {
        test('extracts imports from file content', () => {
            const mockContent = `
                import Component from 'overridable!./Component'
                import { something } from 'overridable!./other'
                import('overridable!./dynamic')
            `
            jest.spyOn(fse, 'readFileSync').mockReturnValue(mockContent)

            const result = overrideUtils.extractOverridableImports('file.ts', 'test-extension')
            expect(result).toHaveLength(3)
            expect(result[0].importPath).toBe('./Component')
            expect(result[0].extension).toBe('test-extension')
        })
    })

    describe('resolveExtensionPath', () => {
        test('resolves extension path in app directory', () => {
            const appPath = path.join(mockProjectDir, 'app', 'application-extensions', 'ext1')
            jest.spyOn(fse, 'existsSync').mockImplementation((p) => p === appPath)

            const result = overrideUtils.resolveExtensionPath('ext1', mockProjectDir)
            expect(result).toBe(appPath)
        })

        test('resolves extension path in node_modules', () => {
            const modulePath = path.join(mockProjectDir, 'node_modules', 'ext1')
            jest.spyOn(fse, 'existsSync').mockImplementation((p) => p === modulePath)

            const result = overrideUtils.resolveExtensionPath('ext1', mockProjectDir)
            expect(result).toBe(modulePath)
        })

        test('returns null when extension not found', () => {
            jest.spyOn(fse, 'existsSync').mockReturnValue(false)

            const result = overrideUtils.resolveExtensionPath('non-existent', mockProjectDir)
            expect(result).toBeNull()
        })
    })

    describe('hasCorrespondingOverridableImport', () => {
        const overridableImports = [
            {
                importPath: './Button',
                sourceFile: 'source.ts',
                extension: 'ext1'
            }
        ]

        test('returns true for matching override', () => {
            const overrideFile = path.join(mockProjectDir, 'src', 'overrides', 'ext1', 'Button.tsx')
            const result = overrideUtils.hasCorrespondingOverridableImport(
                overrideFile,
                overridableImports,
                mockProjectDir
            )
            expect(result).toBe(true)
        })

        test('returns false for non-matching override', () => {
            const overrideFile = path.join(mockProjectDir, 'src', 'overrides', 'ext2', 'Button.tsx')
            const result = overrideUtils.hasCorrespondingOverridableImport(
                overrideFile,
                overridableImports,
                mockProjectDir
            )
            expect(result).toBe(false)
        })
    })

    describe('groupImportsBySourceFile', () => {
        test('groups imports correctly', () => {
            const imports = [
                {
                    importPath: './Button',
                    sourceFile: path.join(mockProjectDir, 'src', 'file1.ts'),
                    extension: 'ext1'
                },
                {
                    importPath: './Input',
                    sourceFile: path.join(mockProjectDir, 'src', 'file1.ts'),
                    extension: 'ext1'
                },
                {
                    importPath: './Card',
                    sourceFile: path.join(mockProjectDir, 'src', 'file2.ts'),
                    extension: 'ext2'
                }
            ]

            const result = overrideUtils.groupImportsBySourceFile(imports, mockProjectDir)
            expect(Object.keys(result)).toHaveLength(2)
            const file1Key = path.posix.join('src', 'file1.ts')
            const file2Key = path.posix.join('src', 'file2.ts')
            expect(result[file1Key].paths).toEqual(['./Button', './Input'])
            expect(result[file2Key].paths).toEqual(['./Card'])
        })
    })
})
