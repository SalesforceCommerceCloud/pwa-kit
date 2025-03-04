/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import {
    findFiles,
    extractOverridableImports,
    getPackageNameFromDir,
    resolveExtensionPath,
    findOverridableImports,
    findOverrideFiles,
    findAppOverrideFiles,
    hasCorrespondingOverridableImport,
    groupImportsBySourceFile,
    SUPPORTED_FILE_EXTENSIONS,
    OVERRIDES_DIR,
    SRC_DIR,
    APP_DIR,
    NODE_MODULES,
    IMPORT_REGEX,
    OverridableImport
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
        it('returns empty array if directory does not exist', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = findFiles('/test', SUPPORTED_FILE_EXTENSIONS)
            expect(result).toEqual([])
        })

        it('finds files with supported extensions', () => {
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
        it('extracts overridable imports from file content', () => {
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

        it('uses IMPORT_REGEX to match imports', () => {
            mockFs.readFileSync.mockReturnValue('import x from "overridable!./test"')
            const result = extractOverridableImports('/test/file.js')
            expect(result).toHaveLength(1)
            IMPORT_REGEX.lastIndex = 0
            const match = IMPORT_REGEX.exec('import x from "overridable!./test"')
            expect(match).toBeTruthy()
            expect(match![1]).toBe('./test')
        })
    })

    describe('getPackageNameFromDir', () => {
        it('returns package name from package.json', () => {
            mockFs.readFileSync.mockReturnValue('{"name": "test-package"}')
            const result = getPackageNameFromDir('/project')
            expect(result).toBe('test-package')
            expect(mockFs.readFileSync).toHaveBeenCalledWith(
                path.join('/project', 'package.json'),
                'utf8'
            )
        })

        it('returns null on error', () => {
            mockFs.readFileSync.mockImplementation(() => {
                throw new Error('File not found')
            })
            const result = getPackageNameFromDir('/project')
            expect(result).toBeNull()
        })
    })

    describe('resolveExtensionPath', () => {
        it('resolves local extension path in app directory', () => {
            mockFs.existsSync.mockImplementation(
                (p: string) =>
                    p === path.join('/project', APP_DIR, 'application-extensions', 'test_ext')
            )
            const result = resolveExtensionPath('test/ext', '/project')
            expect(result).toBe(
                path.join('/project', APP_DIR, 'application-extensions', 'test_ext')
            )
        })

        it('resolves node_modules path', () => {
            mockFs.existsSync.mockImplementation(
                (p: string) => p === path.join('/project', NODE_MODULES, 'test/ext')
            )
            const result = resolveExtensionPath('test/ext', '/project')
            expect(result).toBe(path.join('/project', NODE_MODULES, 'test/ext'))
        })

        it('returns null if no path exists', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = resolveExtensionPath('test/ext', '/project')
            expect(result).toBeNull()
        })
    })

    describe('findOverridableImports', () => {
        it.skip('finds imports from src and app directories', () => {
            mockFs.existsSync.mockImplementation((p: string) => {
                const srcDir = path.join('/project', SRC_DIR)
                const appDir = path.join('/project', APP_DIR)
                return p === srcDir || p === appDir
            })

            mockGlob.sync.mockImplementation((pattern: string) => {
                if (pattern.includes(SRC_DIR)) {
                    return ['/project/src/file.js']
                }
                if (pattern.includes(APP_DIR)) {
                    return ['/project/app/file.js']
                }
                return []
            })

            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath === path.join('/project', 'package.json')) {
                    return '{"mobify": {}}'
                }
                if (filePath === '/project/src/file.js') {
                    return 'import x from "overridable!./test"'
                }
                if (filePath === '/project/app/file.js') {
                    return 'import y from "overridable!./app-test"'
                }
                throw new Error(`Unexpected filePath: ${filePath}`)
            })

            mockHelpers.getConfiguredExtensions.mockReturnValue([])

            const result = findOverridableImports('/project')
            expect(result).toEqual([
                {importPath: './test', sourceFile: '/project/src/file.js', extension: undefined},
                {importPath: './app-test', sourceFile: '/project/app/file.js', extension: undefined}
            ])
        })

        it.skip('includes extension imports', () => {
            mockFs.existsSync.mockImplementation((p: string) => {
                return (
                    p === path.join('/project', SRC_DIR) ||
                    p === path.join('/project', APP_DIR) ||
                    p === path.join('/project', NODE_MODULES, 'ext') ||
                    p === path.join('/project', NODE_MODULES, 'ext', SRC_DIR)
                )
            })

            mockGlob.sync.mockImplementation((pattern: string) => {
                if (pattern.includes(SRC_DIR) && !pattern.includes('ext')) {
                    return []
                }
                if (pattern.includes(APP_DIR)) {
                    return []
                }
                if (pattern.includes('ext') && pattern.includes(SRC_DIR)) {
                    return ['/project/node_modules/ext/src/file.js']
                }
                return []
            })

            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath === path.join('/project', 'package.json')) {
                    return '{"mobify": {"extensions": {"ext": {}}}}'
                }
                if (filePath === '/project/node_modules/ext/src/file.js') {
                    return 'import x from "overridable!./ext"'
                }
                throw new Error(`Unexpected filePath: ${filePath}`)
            })

            mockHelpers.getConfiguredExtensions.mockReturnValue([['ext']])

            const result = findOverridableImports('/project')
            expect(result).toContainEqual({
                importPath: './ext',
                sourceFile: '/project/node_modules/ext/src/file.js',
                extension: 'ext'
            })
        })
    })

    describe('findOverrideFiles', () => {
        it('finds override files in src/overrides', () => {
            mockFs.existsSync.mockReturnValue(true)
            mockGlob.sync.mockReturnValue(['/project/src/overrides/file.js'])
            const result = findOverrideFiles('/project')
            expect(result).toEqual(['/project/src/overrides/file.js'])
            expect(mockGlob.sync).toHaveBeenCalledWith(
                path.join('/project', SRC_DIR, OVERRIDES_DIR, '**/*+(.js|.jsx|.ts|.tsx)'),
                {nodir: true, absolute: true}
            )
        })

        it('returns empty array if overrides dir does not exist', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = findOverrideFiles('/project')
            expect(result).toEqual([])
        })
    })

    describe('findAppOverrideFiles', () => {
        it('finds override files in app/overrides', () => {
            mockFs.existsSync.mockReturnValue(true)
            mockGlob.sync.mockReturnValue(['/project/app/overrides/file.tsx'])
            const result = findAppOverrideFiles('/project')
            expect(result).toEqual(['/project/app/overrides/file.tsx'])
            expect(mockGlob.sync).toHaveBeenCalledWith(
                path.join('/project', APP_DIR, OVERRIDES_DIR, '**/*+(.js|.jsx|.ts|.tsx)'),
                {nodir: true, absolute: true}
            )
        })

        it('returns empty array if app overrides dir does not exist', () => {
            mockFs.existsSync.mockReturnValue(false)
            const result = findAppOverrideFiles('/project')
            expect(result).toEqual([])
        })
    })

    describe('hasCorrespondingOverridableImport', () => {
        it('matches override file to import in src/overrides', () => {
            const overrideFile = path.join(
                '/project',
                SRC_DIR,
                OVERRIDES_DIR,
                'test-ext',
                'component.js'
            )
            const imports: OverridableImport[] = [
                {importPath: './component', sourceFile: '/some/file.js'}
            ]
            const result = hasCorrespondingOverridableImport(overrideFile, imports, '/project')
            expect(result).toBe(true)
        })

        it('returns false for non-matching import', () => {
            const overrideFile = path.join(
                '/project',
                APP_DIR,
                OVERRIDES_DIR,
                'test-ext',
                'component.js'
            )
            const imports: OverridableImport[] = [
                {importPath: './different', sourceFile: '/some/file.js'}
            ]
            const result = hasCorrespondingOverridableImport(overrideFile, imports, '/project')
            expect(result).toBe(false)
        })
    })

    describe('groupImportsBySourceFile', () => {
        it('groups imports by source file with path.relative', () => {
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
