/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {PwaKitConfigPlugin} from './plugins'

describe('PwaKitConfigPlugin', () => {
    test('can instantiate new instance', () => {
        new PwaKitConfigPlugin()
    })

    test('has a default config path', () => {
        const plugin = new PwaKitConfigPlugin()
        expect(plugin.CONFIG_PATH).toBe('./pwa-kit.config.json')
    })

    test('getFile', () => {
        const plugin = new PwaKitConfigPlugin()
        const readFileSyncMock = jest.fn()
        const compiler = {
            inputFileSystem: {
                fileSystem: {
                    readFileSync: readFileSyncMock
                }
            }
        }
        plugin.getFile(compiler, 'path')

        expect(readFileSyncMock).toBeCalled()
    })

    test('getConfig', () => {
        const plugin = new PwaKitConfigPlugin()

        const compiler = {}

        plugin.getFile = jest.fn()
        plugin.getConfig(compiler, 'path')

        expect(plugin.getFile).toHaveBeenCalledWith(compiler, plugin.CONFIG_PATH)
    })

    test('does not throw an error if the config file is not found', () => {
        const plugin = new PwaKitConfigPlugin()

        const compiler = {}

        plugin.getFile = jest.fn().mockImplementation(() => {
            throw new Error('file not found')
        })

        expect(plugin.getConfig(compiler, 'path')).toBeUndefined()
    })

    test('throws an error if the config file is not valid json', () => {
        const plugin = new PwaKitConfigPlugin()

        const compiler = {}
        plugin.getFile = jest.fn().mockReturnValue('[.}')

        expect(() => plugin.getConfig(compiler, 'path')).toThrow()
    })
})
