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

    test('have default config path', () => {
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

    test('getConfig not throw if file not found', () => {
        const plugin = new PwaKitConfigPlugin()

        const compiler = {}

        plugin.getFile = jest.fn().mockImplementation(() => {
            throw new Error('file not found')
        })

        expect(plugin.getConfig(compiler, 'path')).toBeUndefined()
    })

    test('getConfig throws if data is invalid', () => {
        const plugin = new PwaKitConfigPlugin()

        const compiler = {}
        plugin.getFile = jest.fn().mockReturnValue('[.}')

        expect(() => plugin.getConfig(compiler, 'path')).toThrow()
    })

    const validateFailingCases = [
        [{}, "config must have required property 'url'"],
        [{url: 1}, 'config/url must be object'],
        [{url: {locale: 'test'}}, 'config/url/locale must be equal to one of the allowed values']
    ]
    describe('validate', () => {
        test.each(validateFailingCases)('validation errors', (config, message) => {
            const plugin = new PwaKitConfigPlugin()
            expect(() => plugin.validate(config)).toThrow(message)
        })
    })

    const validateSuccessCases = [
        [{url: {locale: 'path'}}],
        [{url: {locale: 'path'}, otherkeys: 1}]
    ]
    describe('validate', () => {
        test.each(validateSuccessCases)('validation success', (config) => {
            const plugin = new PwaKitConfigPlugin()
            expect(() => plugin.validate(config)).not.toThrow()
        })
    })
})
