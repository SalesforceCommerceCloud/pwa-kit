/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fse from 'fs-extra'
import * as path from 'path'
import {buildBabelExtensibilityArgs} from './babel/utils'
import {ApplicationExtensionEntry, ApplicationExtensionEntryTuple} from '../types'
import {LOCAL_EXTENSIONS_DIR, OVERRIDABLE_FILE_NAME, NODE_MODULES_FOLDER} from './constants'
import {getOverridesFromFile, getForceOverridesFilePaths} from './utils'

jest.mock('fs-extra', () => ({
    ...jest.requireActual('fs-extra'),
    realpathSync: jest.fn(),
    readFileSync: jest.fn()
}))

const EXTENSIONS: ApplicationExtensionEntryTuple[] = [
    ['@salesforce/extension-this', {enabled: true}],
    ['@salesforce/extension-that', {enabled: true}]
]
const CONFIG = {
    app: {extensions: EXTENSIONS}
}

const normalizePath = (posixPath: string) => posixPath.split(path.posix.sep).join(path.sep)

describe('buildBabelExtensibilityArgs', () => {
    const realpathSyncMock = jest.spyOn(fse, 'realpathSync') as jest.Mock

    beforeEach(() => {
        realpathSyncMock.mockImplementation((filePath: string) => {
            if (filePath.includes('build-remote-server.js')) {
                return normalizePath('/absolute/path/to/build-remote-server.js')
            }
            if (filePath.includes('application-extensions.js')) {
                return normalizePath('/absolute/path/to/application-extensions.js')
            }
            if (filePath.includes(normalizePath('@salesforce/extension-this/src'))) {
                return normalizePath('/absolute/path/to/@salesforce/extension-this/src')
            }
            if (filePath.includes(normalizePath('@salesforce/extension-that/src'))) {
                return normalizePath('/absolute/path/to/@salesforce/extension-that/src')
            }
            throw new Error(`Unexpected path: ${filePath}`)
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should return the correct Babel arguments string', () => {
        const expectedArgs = `--only "app${path.sep}**,${path.sep}absolute${path.sep}path${path.sep}to${path.sep}build-remote-server.js,${path.sep}absolute${path.sep}path${path.sep}to${path.sep}application-extensions.js,${path.sep}absolute${path.sep}path${path.sep}to${path.sep}@salesforce${path.sep}extension-this${path.sep}src${path.sep}**,${path.sep}absolute${path.sep}path${path.sep}to${path.sep}@salesforce${path.sep}extension-that${path.sep}src${path.sep}**"`
        const result = buildBabelExtensibilityArgs(CONFIG)
        expect(result).toBe(expectedArgs)
    })

    test('should call realpathSync with the correct paths for each extension', () => {
        buildBabelExtensibilityArgs(CONFIG)

        // Validate that realpathSync was called with the correct paths
        expect(fse.realpathSync).toHaveBeenCalledWith(
            path.resolve(
                'node_modules/@salesforce/pwa-kit-runtime/ssr/server/build-remote-server.js'
            )
        )
        expect(fse.realpathSync).toHaveBeenCalledWith(
            path.resolve(
                'node_modules/@salesforce/pwa-kit-extension-sdk/express/placeholders/application-extensions.js'
            )
        )
        expect(fse.realpathSync).toHaveBeenCalledWith(
            path.resolve('node_modules/@salesforce/extension-this/src')
        )
        expect(fse.realpathSync).toHaveBeenCalledWith(
            path.resolve('node_modules/@salesforce/extension-that/src')
        )
    })

    test('should handle an empty list of configured extensions', () => {
        const expectedArgs = `--only "app${path.sep}**,${path.sep}absolute${path.sep}path${path.sep}to${path.sep}build-remote-server.js,${path.sep}absolute${path.sep}path${path.sep}to${path.sep}application-extensions.js"`
        const result = buildBabelExtensibilityArgs({app: {extensions: []}})
        expect(result).toBe(expectedArgs)
        const result2 = buildBabelExtensibilityArgs({app: {}})
        expect(result2).toBe(expectedArgs)
    })
})

describe('getOverridesFromFile', () => {
    const readFileSyncMock = jest.spyOn(fse, 'readFileSync') as jest.Mock

    test('returns parsed override entries, skipping comments and blank lines', () => {
        readFileSyncMock.mockReturnValue(`
            // This is a comment
            override1
            override2 // inline comment
              
            // Another comment
            override3
        `)

        const result = getOverridesFromFile('mock/path/.force_overrides')

        expect(result).toEqual(['override1', 'override2', 'override3'])
    })

    test('returns an empty array if file not found (ENOENT)', () => {
        const error = new Error('File not found') as any
        error.code = 'ENOENT'
        readFileSyncMock.mockImplementation(() => {
            throw error
        })

        const result = getOverridesFromFile('nonexistent/path')
        expect(result).toEqual([])
    })

    test('logs warning for other read errors and returns empty array', () => {
        const error = new Error('Permission denied') as any
        error.code = 'EACCES'
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

        readFileSyncMock.mockImplementation(() => {
            throw error
        })

        const result = getOverridesFromFile('bad/path')
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error reading override file at'),
            error
        )
        expect(result).toEqual([])

        warnSpy.mockRestore()
    })
})

describe('getForceOverridesFilePaths', () => {
    const projectDir = '/project'
    const extensions: ApplicationExtensionEntry[] = [
        ['ext-a', {enabled: true}],
        ['ext-b', {enabled: true}],
        ['ext-c', {enabled: true}]
    ]

    test('returns all potential override paths', () => {
        const result = getForceOverridesFilePaths(projectDir, extensions)

        expect(result).toEqual([
            path.join(projectDir, OVERRIDABLE_FILE_NAME),
            path.join(projectDir, LOCAL_EXTENSIONS_DIR, 'ext-a', OVERRIDABLE_FILE_NAME),
            path.join(projectDir, NODE_MODULES_FOLDER, 'ext-a', OVERRIDABLE_FILE_NAME),
            path.join(projectDir, LOCAL_EXTENSIONS_DIR, 'ext-b', OVERRIDABLE_FILE_NAME),
            path.join(projectDir, NODE_MODULES_FOLDER, 'ext-b', OVERRIDABLE_FILE_NAME),
            path.join(projectDir, LOCAL_EXTENSIONS_DIR, 'ext-c', OVERRIDABLE_FILE_NAME),
            path.join(projectDir, NODE_MODULES_FOLDER, 'ext-c', OVERRIDABLE_FILE_NAME)
        ])
    })

    test('handles an empty extensions array', () => {
        const result = getForceOverridesFilePaths(projectDir, [])
        expect(result).toEqual([path.join(projectDir, OVERRIDABLE_FILE_NAME)])
    })
})
