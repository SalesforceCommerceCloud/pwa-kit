/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import {OVERRIDES, SRC, APP, NODE_MODULES} from './index'
import {OverridableImport} from '../../types'
import {
    findFiles,
    extractOverridableImports,
    resolveExtensionPath,
    findOverridableImports,
    findOverrideFiles,
    hasCorrespondingOverridableImport,
    groupImportsBySourceFile,
    SUPPORTED_FILE_EXTENSIONS,
    IMPORT_REGEX
} from './overridables'

interface MockFs {
    existsSync: jest.Mock
    readFileSync: jest.Mock
}

interface MockGlob {
    sync: jest.Mock
}

interface MockHelpers {
    getConfiguredExtensions: jest.Mock
}

const mockFs = fs as unknown as MockFs
const mockGlob = glob as unknown as MockGlob
const mockHelpers = {getConfiguredExtensions: jest.fn()} as MockHelpers

jest.mock('fs')
jest.mock('glob', () => ({
    sync: jest.fn()
}))
jest.mock('./helpers', () => ({
    getConfiguredExtensions: jest.fn()
}))

describe('Overridables Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockFs.existsSync.mockReset()
        mockFs.readFileSync.mockReset()
        mockGlob.sync.mockReset()
        mockHelpers.getConfiguredExtensions.mockReset()
    })

    describe('findFiles', () => {
        test('returns empty array if directory does not exist', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = findFiles('/test', SUPPORTED_FILE_EXTENSIONS)
            expect(result).toEqual([])
        })

        test('finds files with supported extensions', () => {
            mockFs.existsSync.mockReturnValue(true)
            mockGlob.sync.mockReturnValue(['/test/file.js', '/test/sub/file.tsx'])
            const result = findFiles('/test', SUPPORTED_FILE_EXTENSIONS)
            expect(result).toEqual(['/test/file.js', '/test/sub/file.tsx'])
            expect(mockGlob.sync).toHaveBeenCalledWith('/test/**/*+(.js|.jsx|.ts|.tsx)', {
                nodir: true,
                absolute: true
            })
        })
    })

    describe('extractOverridableImports', () => {
        test('extracts overridable imports from file content', () => {
            mockFs.readFileSync.mockReturnValue(`
                import x from "overridable!./component";
                import y from "other";
                import("overridable!./dynamic")
            `)
            const result = extractOverridableImports('/test/file.js', 'test-ext')
            expect(result).toEqual([
                {importPath: './component', sourceFile: '/test/file.js', extension: 'test-ext'},
                {importPath: './dynamic', sourceFile: '/test/file.js', extension: 'test-ext'}
            ])
        })

        test('uses IMPORT_REGEX to match imports', () => {
            mockFs.readFileSync.mockReturnValue('import x from "overridable!./test"')
            const result = extractOverridableImports('/test/file.js')
            expect(result).toHaveLength(1)
            IMPORT_REGEX.lastIndex = 0
            const match = IMPORT_REGEX.exec('import x from "overridable!./test"')
            expect(match).toBeTruthy()
            expect(match![1]).toBe('./test')
        })
    })

    describe('resolveExtensionPath', () => {
        test('resolves local extension path in app directory', () => {
            mockFs.existsSync.mockImplementation(
                (p: string) =>
                    p === path.join('/project', APP, 'application-extensions', 'test_ext')
            )
            const result = resolveExtensionPath('test/ext', '/project')
            expect(result).toBe(path.join('/project', APP, 'application-extensions', 'test_ext'))
        })

        test('resolves node_modules path', () => {
            mockFs.existsSync.mockImplementation(
                (p: string) => p === path.join('/project', NODE_MODULES, 'test/ext')
            )
            const result = resolveExtensionPath('test/ext', '/project')
            expect(result).toBe(path.join('/project', NODE_MODULES, 'test/ext'))
        })

        test('returns null if no path exists', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = resolveExtensionPath('test/ext', '/project')
            expect(result).toBeNull()
        })
    })

    describe('findOverrideFiles', () => {
        test('finds override files in src/overrides', () => {
            mockFs.existsSync.mockReturnValue(true)
            mockGlob.sync.mockReturnValue(['/project/src/overrides/file.js'])
            const result = findOverrideFiles('/project')
            expect(result).toEqual(['/project/src/overrides/file.js'])
            expect(mockGlob.sync).toHaveBeenCalledWith(
                path.join('/project', SRC, OVERRIDES, '**/*+(.js|.jsx|.ts|.tsx)'),
                {nodir: true, absolute: true}
            )
        })

        test('returns empty array if overrides dir does not exist', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = findOverrideFiles('/project')
            expect(result).toEqual([])
        })
    })

    describe('findOverridableImports', () => {
        test('finds imports in project src and app directories', () => {
            // Mock file system existence checks
            mockFs.existsSync.mockImplementation(
                (p: string) => p === path.join('/project', SRC) || p === path.join('/project', APP)
            )

            // Mock file findings
            mockGlob.sync.mockImplementation((pattern: string) => {
                if (pattern.includes(SRC)) {
                    return [path.join('/project', SRC, 'file1.js')]
                }
                if (pattern.includes(APP)) {
                    return [path.join('/project', APP, 'file2.js')]
                }
                return []
            })

            // Mock file contents with overridable imports
            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath === path.join('/project', SRC, 'file1.js')) {
                    return 'import x from "overridable!./component1"'
                }
                if (filePath === path.join('/project', APP, 'file2.js')) {
                    return 'import y from "overridable!./component2"'
                }
                return ''
            })

            // Mock package.json that throws error (no extensions)
            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath === path.join('/project', 'package.json')) {
                    throw new Error('Invalid JSON')
                }
                return ''
            })

            const result = findOverridableImports('/project')
            expect(result).toEqual([
                {
                    importPath: './component1',
                    sourceFile: path.join('/project', SRC, 'file1.js')
                },
                {
                    importPath: './component2',
                    sourceFile: path.join('/project', APP, 'file2.js')
                }
            ])
        })

        test('includes imports from configured extensions', () => {
            // Mock file system existence checks
            mockFs.existsSync.mockImplementation(
                (p: string) =>
                    p === path.join('/project', SRC) ||
                    p === path.join('/project', APP) ||
                    p === path.join('/project', NODE_MODULES, 'test-ext')
            )

            // Mock file findings
            mockGlob.sync.mockImplementation((pattern: string) => {
                if (pattern.includes(SRC) && !pattern.includes('test-ext')) {
                    return [path.join('/project', SRC, 'file1.js')]
                }
                if (pattern.includes(APP)) {
                    return []
                }
                if (pattern.includes('test-ext')) {
                    return [path.join('/project', NODE_MODULES, 'test-ext', SRC, 'ext-file.js')]
                }
                return []
            })

            // Mock file contents
            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath === path.join('/project', SRC, 'file1.js')) {
                    return 'import x from "overridable!./component"'
                }
                if (
                    filePath === path.join('/project', NODE_MODULES, 'test-ext', SRC, 'ext-file.js')
                ) {
                    return 'import y from "overridable!./ext-component"'
                }
                if (filePath === path.join('/project', 'package.json')) {
                    return '{"mobify": {"extensions": ["test-ext"]}}'
                }
                return ''
            })

            // Mock getConfiguredExtensions
            mockHelpers.getConfiguredExtensions.mockReturnValue([['test-ext']])

            const result = findOverridableImports('/project')
            expect(result).toEqual([
                {
                    importPath: './component',
                    sourceFile: path.join('/project', SRC, 'file1.js')
                },
                {
                    importPath: './ext-component',
                    sourceFile: path.join('/project', NODE_MODULES, 'test-ext', SRC, 'ext-file.js'),
                    extension: 'test-ext'
                }
            ])
        })

        test('returns project imports when package.json is invalid', () => {
            // Mock file system existence checks
            mockFs.existsSync.mockImplementation((p: string) => p === path.join('/project', SRC))

            // Mock file findings
            mockGlob.sync.mockImplementation((pattern: string) => {
                if (pattern.includes(SRC)) {
                    return [path.join('/project', SRC, 'file1.js')]
                }
                return []
            })

            // Mock file contents and invalid package.json
            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath === path.join('/project', SRC, 'file1.js')) {
                    return 'import x from "overridable!./component"'
                }
                if (filePath === path.join('/project', 'package.json')) {
                    throw new Error('Invalid JSON')
                }
                return ''
            })

            const result = findOverridableImports('/project')
            expect(result).toEqual([
                {
                    importPath: './component',
                    sourceFile: path.join('/project', SRC, 'file1.js')
                }
            ])
        })

        test('returns empty array when no imports are found', () => {
            // Mock file system existence checks
            mockFs.existsSync.mockImplementation(
                (p: string) => p === path.join('/project', SRC) || p === path.join('/project', APP)
            )

            // Mock no files found
            mockGlob.sync.mockReturnValue([])

            // Mock empty package.json
            mockFs.readFileSync.mockReturnValue('{"mobify": {}}')
            mockHelpers.getConfiguredExtensions.mockReturnValue([])

            const result = findOverridableImports('/project')
            expect(result).toEqual([])
        })
    })

    describe('hasCorrespondingOverridableImport', () => {
        test('matches override file to import in src/overrides', () => {
            const overrideFile = path.join('/project', SRC, OVERRIDES, 'test-ext', 'component.js')
            const imports: OverridableImport[] = [
                {importPath: './component', sourceFile: '/some/file.js'}
            ]
            const result = hasCorrespondingOverridableImport(overrideFile, imports, '/project')
            expect(result).toBe(true)
        })

        test('returns false for non-matching import', () => {
            const overrideFile = path.join('/project', APP, OVERRIDES, 'test-ext', 'component.js')
            const imports: OverridableImport[] = [
                {importPath: './different', sourceFile: '/some/file.js'}
            ]
            const result = hasCorrespondingOverridableImport(overrideFile, imports, '/project')
            expect(result).toBe(false)
        })
    })

    describe('groupImportsBySourceFile', () => {
        test('groups imports by source file with path.relative', () => {
            const imports: OverridableImport[] = [
                {importPath: './comp1', sourceFile: path.join('/project', 'src', 'file1.js')},
                {importPath: './comp2', sourceFile: path.join('/project', 'src', 'file1.js')},
                {importPath: './comp3', sourceFile: path.join('/project', 'src', 'file2.js')}
            ]
            const result = groupImportsBySourceFile(imports, '/project')
            expect(result).toEqual({
                'src/file1.js': {paths: ['./comp1', './comp2'], extension: undefined},
                'src/file2.js': {paths: ['./comp3'], extension: undefined}
            })
        })
    })
})
