/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs'
import path from 'path'
import glob from 'glob'
import {
    findFiles,
    extractOverridableImports,
    getPackageNameFromDir,
    findOverridableImports,
    findOverrideFiles,
    findAppOverrideFiles,
    hasCorrespondingOverridableImport,
    groupImportsBySourceFile,
    IMPORT_REGEX
} from './overridables'

// Mock fs, path, and glob modules
jest.mock('fs')
jest.mock('path')
jest.mock('glob')

const mockedFs = fs as jest.Mocked<typeof fs>
const mockedPath = path as jest.Mocked<typeof path>
const mockedGlob = glob as jest.Mocked<typeof glob>

describe('overridables utility functions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        
        // Default path.join implementation
        mockedPath.join.mockImplementation((...paths) => paths.join('/'))
        
        // Default path.relative implementation
        mockedPath.relative.mockImplementation((from, to) => to.replace(from, ''))
        
        // Default path.dirname implementation
        mockedPath.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'))
        
        // Default path.sep value
        mockedPath.sep = '/'
        
        // Default path.normalize implementation
        mockedPath.normalize.mockImplementation((p) => p)
    })
    
    describe('IMPORT_REGEX', () => {
        it('should match static imports with overridable prefix', () => {
            const code = `import {Component} from 'overridable!./path'`
            const matches = [...code.matchAll(IMPORT_REGEX)]
            
            expect(matches.length).toBe(1)
            expect(matches[0][1]).toBe('./path')
        })
        
        it('should match dynamic imports with overridable prefix', () => {
            const code = `const Component = loadable(() => import('overridable!./path'), {fallback})`
            const matches = [...code.matchAll(IMPORT_REGEX)]
            
            expect(matches.length).toBe(1)
            expect(matches[0][2]).toBe('./path')
        })
        
        it('should match multiple imports in the same file', () => {
            const code = `
                import {ComponentA} from 'overridable!./path-a'
                import {ComponentB} from 'overridable!./path-b'
                const ComponentC = loadable(() => import('overridable!./path-c'), {fallback})
            `
            const matches = [...code.matchAll(IMPORT_REGEX)]
            
            expect(matches.length).toBe(3)
            expect(matches[0][1]).toBe('./path-a')
            expect(matches[1][1]).toBe('./path-b')
            expect(matches[2][2]).toBe('./path-c')
        })
    })
    
    describe('findFiles', () => {
        it('should return empty array if directory does not exist', () => {
            mockedFs.existsSync.mockReturnValue(false)
            
            const result = findFiles('/test-dir', ['.js', '.ts'])
            
            expect(result).toEqual([])
            expect(mockedFs.existsSync).toHaveBeenCalledWith('/test-dir')
            expect(mockedGlob.sync).not.toHaveBeenCalled()
        })
        
        it('should return files matching extensions', () => {
            mockedFs.existsSync.mockReturnValue(true)
            mockedGlob.sync.mockReturnValue(['/test-dir/file1.js', '/test-dir/file2.ts'])
            
            const result = findFiles('/test-dir', ['.js', '.ts'])
            
            expect(result).toEqual(['/test-dir/file1.js', '/test-dir/file2.ts'])
            expect(mockedFs.existsSync).toHaveBeenCalledWith('/test-dir')
            expect(mockedGlob.sync).toHaveBeenCalledWith('/test-dir/**/*+(.js|.ts)', {
                nodir: true,
                absolute: true
            })
        })
    })
    
    describe('extractOverridableImports', () => {
        it('should extract static overridable imports', () => {
            const fileContent = `
                import {ComponentA} from 'overridable!./path-a'
                import {ComponentB} from './normal-path'
                import {ComponentC} from 'overridable!./path-c'
            `
            mockedFs.readFileSync.mockReturnValue(fileContent)
            
            const result = extractOverridableImports('/test-file.js')
            
            expect(result).toEqual([
                { importPath: './path-a', sourceFile: '/test-file.js' },
                { importPath: './path-c', sourceFile: '/test-file.js' }
            ])
            expect(mockedFs.readFileSync).toHaveBeenCalledWith('/test-file.js', 'utf8')
        })
        
        it('should extract dynamic overridable imports', () => {
            const fileContent = `
                const ComponentA = loadable(() => import('overridable!./path-a'), {fallback})
                const ComponentB = loadable(() => import('./normal-path'), {fallback})
            `
            mockedFs.readFileSync.mockReturnValue(fileContent)
            
            const result = extractOverridableImports('/test-file.js')
            
            expect(result).toEqual([
                { importPath: './path-a', sourceFile: '/test-file.js' }
            ])
        })
        
        it('should extract both static and dynamic overridable imports', () => {
            const fileContent = `
                import {ComponentA} from 'overridable!./path-a'
                const ComponentB = loadable(() => import('overridable!./path-b'), {fallback})
            `
            mockedFs.readFileSync.mockReturnValue(fileContent)
            
            const result = extractOverridableImports('/test-file.js')
            
            expect(result).toEqual([
                { importPath: './path-a', sourceFile: '/test-file.js' },
                { importPath: './path-b', sourceFile: '/test-file.js' }
            ])
        })
    })
    
    describe('getPackageNameFromDir', () => {
        it('should return package name from package.json', () => {
            mockedFs.readFileSync.mockReturnValue(JSON.stringify({ name: 'test-package' }))
            
            const result = getPackageNameFromDir('/test-dir')
            
            expect(result).toBe('test-package')
            expect(mockedFs.readFileSync).toHaveBeenCalledWith('/test-dir/package.json', 'utf8')
        })
        
        it('should return null if package.json cannot be read', () => {
            mockedFs.readFileSync.mockImplementation(() => {
                throw new Error('File not found')
            })
            
            const result = getPackageNameFromDir('/test-dir')
            
            expect(result).toBeNull()
        })
    })
    
    describe('findOverridableImports', () => {
        it('should find overridable imports in src directory', () => {
            // Setup mocks
            mockedFs.existsSync.mockImplementation((path) => path.includes('/src'))
            mockedGlob.sync.mockReturnValue(['/test-dir/src/file1.js', '/test-dir/src/file2.ts'])
            mockedFs.readFileSync.mockImplementation((path) => {
                if (path.includes('file1.js')) {
                    return `import {ComponentA} from 'overridable!./path-a'`
                } else {
                    return `const ComponentB = loadable(() => import('overridable!./path-b'), {fallback})`
                }
            })
            
            const result = findOverridableImports('/test-dir')
            
            expect(result).toEqual([
                { importPath: './path-a', sourceFile: '/test-dir/src/file1.js' },
                { importPath: './path-b', sourceFile: '/test-dir/src/file2.ts' }
            ])
        })
        
        it('should find overridable imports in app directory', () => {
            // Setup mocks
            mockedFs.existsSync.mockImplementation((path) => path.includes('/app'))
            mockedGlob.sync.mockReturnValue(['/test-dir/app/file1.js', '/test-dir/app/file2.ts'])
            mockedFs.readFileSync.mockImplementation((path) => {
                if (path.includes('file1.js')) {
                    return `import {ComponentA} from 'overridable!./path-a'`
                } else {
                    return `const ComponentB = loadable(() => import('overridable!./path-b'), {fallback})`
                }
            })
            
            const result = findOverridableImports('/test-dir')
            
            expect(result).toEqual([
                { importPath: './path-a', sourceFile: '/test-dir/app/file1.js' },
                { importPath: './path-b', sourceFile: '/test-dir/app/file2.ts' }
            ])
        })
        
        it('should find overridable imports in both src and app directories', () => {
            // Setup mocks
            mockedFs.existsSync.mockReturnValue(true)
            mockedGlob.sync.mockImplementation((pattern) => {
                if (pattern.includes('/src/')) {
                    return ['/test-dir/src/file1.js']
                } else {
                    return ['/test-dir/app/file2.ts']
                }
            })
            mockedFs.readFileSync.mockImplementation((path) => {
                if (path.includes('file1.js')) {
                    return `import {ComponentA} from 'overridable!./path-a'`
                } else {
                    return `const ComponentB = loadable(() => import('overridable!./path-b'), {fallback})`
                }
            })
            
            const result = findOverridableImports('/test-dir')
            
            expect(result).toEqual([
                { importPath: './path-a', sourceFile: '/test-dir/src/file1.js' },
                { importPath: './path-b', sourceFile: '/test-dir/app/file2.ts' }
            ])
        })
        
        it('should return empty array if no source files found', () => {
            // Setup mocks
            mockedFs.existsSync.mockReturnValue(false)
            
            const result = findOverridableImports('/test-dir')
            
            expect(result).toEqual([])
        })
    })
    
    describe('findOverrideFiles and findAppOverrideFiles', () => {
        it('should find override files in src/overrides directory', () => {
            // Setup mocks
            mockedFs.existsSync.mockImplementation((path) => path.includes('/src/overrides'))
            mockedGlob.sync.mockReturnValue([
                '/test-dir/src/overrides/ext1/file1.js',
                '/test-dir/src/overrides/ext2/file2.ts'
            ])
            
            const result = findOverrideFiles('/test-dir')
            
            expect(result).toEqual([
                '/test-dir/src/overrides/ext1/file1.js',
                '/test-dir/src/overrides/ext2/file2.ts'
            ])
        })
        
        it('should find override files in app/overrides directory', () => {
            // Setup mocks
            mockedFs.existsSync.mockImplementation((path) => path.includes('/app/overrides'))
            mockedGlob.sync.mockReturnValue([
                '/test-dir/app/overrides/ext1/file1.js',
                '/test-dir/app/overrides/ext2/file2.ts'
            ])
            
            const result = findAppOverrideFiles('/test-dir')
            
            expect(result).toEqual([
                '/test-dir/app/overrides/ext1/file1.js',
                '/test-dir/app/overrides/ext2/file2.ts'
            ])
        })
        
        it('should return empty array if overrides directory does not exist', () => {
            // Setup mocks
            mockedFs.existsSync.mockReturnValue(false)
            
            const srcResult = findOverrideFiles('/test-dir')
            const appResult = findAppOverrideFiles('/test-dir')
            
            expect(srcResult).toEqual([])
            expect(appResult).toEqual([])
        })
    })
    
    describe('hasCorrespondingOverridableImport', () => {
        it('should return true if override file has corresponding import in src/overrides', () => {
            // Setup mocks
            mockedPath.join.mockImplementation((...paths) => paths.join('/'))
            mockedPath.relative.mockImplementation((from, to) => 'ext1/component')
            
            const overrideFile = '/test-dir/src/overrides/ext1/component.js'
            const overridableImports = [
                { importPath: './component', sourceFile: '/test-dir/src/file.js' }
            ]
            
            const result = hasCorrespondingOverridableImport(overrideFile, overridableImports, '/test-dir')
            
            expect(result).toBe(true)
        })
        
        it('should return true if override file has corresponding import in app/overrides', () => {
            // Setup mocks
            mockedPath.join.mockImplementation((...paths) => paths.join('/'))
            mockedPath.relative.mockImplementation((from, to) => 'ext1/component')
            
            const overrideFile = '/test-dir/app/overrides/ext1/component.js'
            const overridableImports = [
                { importPath: './component', sourceFile: '/test-dir/app/file.js' }
            ]
            
            const result = hasCorrespondingOverridableImport(overrideFile, overridableImports, '/test-dir')
            
            expect(result).toBe(true)
        })
        
        it('should return false if override file has no corresponding import', () => {
            // Setup mocks
            mockedPath.join.mockImplementation((...paths) => paths.join('/'))
            mockedPath.relative.mockImplementation((from, to) => 'ext1/unknown-component')
            
            const overrideFile = '/test-dir/src/overrides/ext1/unknown-component.js'
            const overridableImports = [
                { importPath: './component', sourceFile: '/test-dir/src/file.js' }
            ]
            
            const result = hasCorrespondingOverridableImport(overrideFile, overridableImports, '/test-dir')
            
            expect(result).toBe(false)
        })
        
        it('should return false if file is not in overrides directory', () => {
            // Setup mocks
            mockedPath.join.mockImplementation((...paths) => paths.join('/'))
            
            const overrideFile = '/test-dir/src/component.js'
            const overridableImports = [
                { importPath: './component', sourceFile: '/test-dir/src/file.js' }
            ]
            
            const result = hasCorrespondingOverridableImport(overrideFile, overridableImports, '/test-dir')
            
            expect(result).toBe(false)
        })
    })
    
    describe('groupImportsBySourceFile', () => {
        it('should group imports by source file', () => {
            // Setup mocks
            mockedPath.relative.mockImplementation((from, to) => {
                if (to.includes('file1')) return 'src/file1.js'
                return 'src/file2.js'
            })
            
            const imports = [
                { importPath: './path-a', sourceFile: '/test-dir/src/file1.js' },
                { importPath: './path-b', sourceFile: '/test-dir/src/file1.js' },
                { importPath: './path-c', sourceFile: '/test-dir/src/file2.js' }
            ]
            
            const result = groupImportsBySourceFile(imports, '/test-dir')
            
            expect(result).toEqual({
                'src/file1.js': ['./path-a', './path-b'],
                'src/file2.js': ['./path-c']
            })
        })
        
        it('should handle empty imports array', () => {
            const result = groupImportsBySourceFile([], '/test-dir')
            
            expect(result).toEqual({})
        })
    })
}) 