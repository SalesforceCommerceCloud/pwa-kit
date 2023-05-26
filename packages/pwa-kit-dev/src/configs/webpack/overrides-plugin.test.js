/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import OverridesResolverPlugin from './overrides-plugin'

const PROJECT_DIR = 'src/configs/webpack/test'
const FS_READ_HASHMAP = new Map([
    ['exists', ['src/configs/webpack/test/overrides/exists.jsx', ['.', 'jsx']]],
    ['path/data', ['src/configs/webpack/test/overrides/path/data.js', ['.', 'js']]],
    ['path', ['/index.jsx', ['index', '', '.', 'jsx']]],
    ['path/nested/icon', ['src/configs/webpack/test/overrides/path/nested/icon.svg', ['.', 'svg']]]
])
const EXTENDS_TARGET = 'retail-react-app'
const REWRITE_DIR = 'src/configs/webpack/test/overrides'
const options = {
    overridesDir: '/overrides',
    extends: ['retail-react-app'],
    projectDir: PROJECT_DIR
}

describe('overrides plugin', () => {
    test('class constructor setup works', () => {
        const overridesResolver = new OverridesResolverPlugin(options)

        expect(overridesResolver.extendsHashMap).toEqual(FS_READ_HASHMAP)
        expect(overridesResolver.projectDir).toBe(PROJECT_DIR)
    })
    test('resolver doResolve() hook is called for files in overrides dir', () => {
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join(process.cwd(), 'fake-file.js')
            },
            path: path.resolve(process.cwd(), 'node_modules', EXTENDS_TARGET),
            request: `${EXTENDS_TARGET}/exists`
        }
        const callback = jest.fn(() => null)
        const resolver = {
            ensureHook: jest.fn(() => null),
            // we only care about calling the callback and the value of `requestContext`
            doResolve: jest.fn((target, requestContext, msg, resolveContext, callback) => {
                if (typeof callback === 'function') {
                    callback()
                }
                return null
            })
        }
        const overridesResolver = new OverridesResolverPlugin(options)
        overridesResolver.handleHook(testRequestContext, {}, callback, resolver)

        expect(callback).toHaveBeenCalled()
        expect(resolver.ensureHook).toHaveBeenCalled()
        expect(resolver.doResolve).toHaveBeenCalledWith(
            null,
            {
                _ResolverCachePluginCacheMiss: true,
                context: {
                    issuer: path.join(process.cwd(), 'fake-file.js')
                },
                path: `${REWRITE_DIR}/exists.jsx`,
                request: 'retail-react-app/exists'
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('nested and non-ts/tsx/js/jsx files rewrite if in overrides', () => {})

    test('jsx base template files can be replaced by tsx files', () => {})

    test('resolver doResolve() hook is NOT called for files NOT in overrides dir', () => {})

    test('a file that requests from relative AND base template is able to get both', () => {})

    test('windows filepaths work', () => {})
})
