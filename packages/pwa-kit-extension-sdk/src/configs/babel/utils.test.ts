/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fse from 'fs-extra'
import * as path from 'path'
import {buildBabelExtensibilityArgs} from './utils'
import {getConfig as originalGetConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

jest.mock('fs-extra', () => ({
    ...jest.requireActual('fs-extra'),
    realpathSync: jest.fn()
}))

const getConfig = originalGetConfig as jest.Mock

describe('buildBabelExtensibilityArgs', () => {
    const realpathSyncMock = jest.spyOn(fse, 'realpathSync') as jest.Mock

    beforeEach(() => {
        getConfig.mockReturnValue({
            app: {
                extensions: ['@salesforce/extension-sample', '@salesforce/extension-another']
            }
        })

        realpathSyncMock.mockImplementation((filePath: string) => {
            if (filePath.includes('build-remote-server.js')) {
                return '/absolute/path/to/build-remote-server.js'
            }
            if (filePath.includes('application-extensions.js')) {
                return '/absolute/path/to/application-extensions.js'
            }
            if (filePath.includes('@salesforce/extension-sample/src')) {
                return '/absolute/path/to/@salesforce/extension-sample/src'
            }
            if (filePath.includes('@salesforce/extension-another/src')) {
                return '/absolute/path/to/@salesforce/extension-another/src'
            }
            throw new Error(`Unexpected path: ${filePath}`)
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should return the correct Babel arguments string', () => {
        const expectedArgs = `--ignore "node_modules/does_not_exist" --only "app/**,/absolute/path/to/build-remote-server.js,/absolute/path/to/application-extensions.js,/absolute/path/to/@salesforce/extension-sample/src,/absolute/path/to/@salesforce/extension-another/src/**"`
        const result = buildBabelExtensibilityArgs()
        expect(result).toBe(expectedArgs)
    })

    test('should call realpathSync with the correct paths for each extension', () => {
        buildBabelExtensibilityArgs()

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
            path.resolve('node_modules/@salesforce/extension-sample/src')
        )
        expect(fse.realpathSync).toHaveBeenCalledWith(
            path.resolve('node_modules/@salesforce/extension-another/src')
        )
    })

    test('should handle an empty list of configured extensions', () => {
        // Modify the mock return value to simulate no configured extensions
        getConfig.mockReturnValue({
            app: {}
        })

        const expectedArgs = `--ignore "node_modules/does_not_exist" --only "app/**,/absolute/path/to/build-remote-server.js,/absolute/path/to/application-extensions.js/**"`
        const result = buildBabelExtensibilityArgs()
        expect(result).toBe(expectedArgs)
    })
})
