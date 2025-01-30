/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fse from 'fs-extra'
import * as path from 'path'
import {buildBabelExtensibilityArgs} from './babel/utils'
import {ApplicationExtensionEntryTuple} from '../types'

jest.mock('fs-extra', () => ({
    ...jest.requireActual('fs-extra'),
    realpathSync: jest.fn()
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
                return '/absolute/path/to/build-remote-server.js'
            }
            if (filePath.includes('application-extensions.js')) {
                return '/absolute/path/to/application-extensions.js'
            }
            if (filePath.includes(normalizePath('@salesforce/extension-this/src'))) {
                return '/absolute/path/to/@salesforce/extension-this/src'
            }
            if (filePath.includes(normalizePath('@salesforce/extension-that/src'))) {
                return '/absolute/path/to/@salesforce/extension-that/src'
            }
            throw new Error(`Unexpected path: ${filePath}`)
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should return the correct Babel arguments string', () => {
        const expectedArgs = `--only "app/**,/absolute/path/to/build-remote-server.js,/absolute/path/to/application-extensions.js,/absolute/path/to/@salesforce/extension-this/src/**,/absolute/path/to/@salesforce/extension-that/src/**"`
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
        const expectedArgs = `--only "app/**,/absolute/path/to/build-remote-server.js,/absolute/path/to/application-extensions.js"`
        const result = buildBabelExtensibilityArgs({app: {extensions: []}})
        expect(result).toBe(expectedArgs)
        const result2 = buildBabelExtensibilityArgs({app: {}})
        expect(result2).toBe(expectedArgs)
    })
})
