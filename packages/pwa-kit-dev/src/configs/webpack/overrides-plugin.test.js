/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import OverridesResolverPlugin from './overrides-plugin'

const PROJECT_DIR = `src/configs/webpack/test`
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

const setupResolverAndCallback = (target, requestContext, msg, resolveContext) => {
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
    return {callback, resolver}
}

describe('overrides plugin', () => {
    test('class constructor setup works', () => {
        const overridesResolver = new OverridesResolverPlugin(options)

        expect(overridesResolver.extendsHashMap).toEqual(FS_READ_HASHMAP)
        expect(overridesResolver.projectDir).toBe(PROJECT_DIR)
    })
    test('resolver doResolve() hook is called for files in overrides dir', () => {
        const REQUEST_PATH = 'exists'
        const REQUEST_EXTENSION = '.jsx'
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join(process.cwd(), 'fake-file.js')
            },
            path: path.resolve(process.cwd(), 'node_modules', EXTENDS_TARGET),
            request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
        }

        const {resolver, callback} = setupResolverAndCallback(
            null,
            testRequestContext,
            null,
            {},
            callback
        )
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
                path: `${REWRITE_DIR}/${REQUEST_PATH}${REQUEST_EXTENSION}`,
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('nested and non-ts/tsx/js/jsx files rewrite if in overrides', () => {
        const REQUEST_PATH = `path/nested/icon`
        const REQUEST_EXTENSION = '.svg'
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join(process.cwd(), 'fake-file.js')
            },
            path: path.resolve(process.cwd(), 'node_modules', EXTENDS_TARGET),
            request: `${EXTENDS_TARGET}/${REQUEST_PATH}${REQUEST_EXTENSION}`
        }

        const {resolver, callback} = setupResolverAndCallback(
            null,
            testRequestContext,
            null,
            {},
            callback
        )
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
                path: `${REWRITE_DIR}/${REQUEST_PATH}${REQUEST_EXTENSION}`,
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}${REQUEST_EXTENSION}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('jsx base template files can be replaced by tsx files', () => {})

    test('resolver doResolve() hook is NOT called for files NOT in overrides dir', () => {
        const REQUEST_PATH = `path/nested/does_not_exist.svg`
        const REQUEST_EXTENSION = '.svg'
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join(process.cwd(), 'fake-file.js')
            },
            path: path.resolve(process.cwd(), 'node_modules', EXTENDS_TARGET),
            request: `${EXTENDS_TARGET}/${REQUEST_PATH}${REQUEST_EXTENSION}`
        }

        const {resolver, callback} = setupResolverAndCallback(
            null,
            testRequestContext,
            null,
            {},
            callback
        )
        const overridesResolver = new OverridesResolverPlugin(options)
        overridesResolver.handleHook(testRequestContext, {}, callback, resolver)

        expect(callback).toHaveBeenCalled()
        expect(resolver.ensureHook).not.toHaveBeenCalled()
        expect(resolver.doResolve).not.toHaveBeenCalled()
    })

    test('a file that requests from relative AND base template is able to get both', () => {
        const REQUEST_ONE_PATH = 'exists'
        const REQUEST_ONE_EXTENSION = '.jsx'
        const testOneRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join(process.cwd(), 'fake-file.js')
            },
            path: path.resolve(process.cwd(), 'node_modules', EXTENDS_TARGET),
            request: `${EXTENDS_TARGET}/${REQUEST_ONE_PATH}`
        }

        let {resolver, callback} = setupResolverAndCallback(
            null,
            testOneRequestContext,
            null,
            {},
            callback
        )
        const overridesResolver = new OverridesResolverPlugin(options)
        overridesResolver.handleHook(testOneRequestContext, {}, callback, resolver)

        expect(callback).toHaveBeenCalled()
        expect(resolver.ensureHook).toHaveBeenCalled()
        expect(resolver.doResolve).toHaveBeenCalledWith(
            null,
            {
                _ResolverCachePluginCacheMiss: true,
                context: {
                    issuer: path.join(process.cwd(), 'fake-file.js')
                },
                path: `${REWRITE_DIR}/${REQUEST_ONE_PATH}${REQUEST_ONE_EXTENSION}`,
                request: `retail-react-app/exists`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )

        // TODO: this might be `..\` on Windows?
        const REQUEST_TWO_PATH = `./exists`
        const testTwoRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join(process.cwd(), 'fake-file.js')
            },
            path: path.resolve(process.cwd()),
            request: REQUEST_TWO_PATH
        }
        ;({resolver, callback} = setupResolverAndCallback(
            null,
            testTwoRequestContext,
            null,
            {},
            callback
        ))
        const _overridesResolver = new OverridesResolverPlugin(options)
        _overridesResolver.handleHook(testTwoRequestContext, {}, callback, resolver)

        expect(callback).toHaveBeenCalled()
        expect(resolver.ensureHook).not.toHaveBeenCalled()
        expect(resolver.doResolve).not.toHaveBeenCalledWith()
    })

    // test('windows filepaths work', () => {
    //     const _original_sep = path.sep
    //     path.sep = '\\'
    //     const REQUEST_PATH = 'exists'
    //     const REQUEST_EXTENSION = '.jsx'
    //     const testRequestContext = {
    //         _ResolverCachePluginCacheMiss: true,
    //         context: {
    //             issuer: path.join(process.cwd(), 'fake-file.js')
    //         },
    //         path: path.resolve(process.cwd(), 'node_modules', EXTENDS_TARGET),
    //         request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
    //     }

    //     const {resolver, callback} = setupResolverAndCallback(
    //         null,
    //         testRequestContext,
    //         null,
    //         {},
    //         callback
    //     )
    //     const overridesResolver = new OverridesResolverPlugin(options)
    //     overridesResolver.handleHook(testRequestContext, {}, callback, resolver)

    //     expect(callback).toHaveBeenCalled()
    //     expect(resolver.ensureHook).toHaveBeenCalled()
    //     expect(resolver.doResolve).toHaveBeenCalledWith(
    //         null,
    //         {
    //             _ResolverCachePluginCacheMiss: true,
    //             context: {
    //                 issuer: path.join(process.cwd(), 'fake-file.js')
    //             },
    //             path: `${REWRITE_DIR}/${REQUEST_PATH}${REQUEST_EXTENSION}`,
    //             request: `retail-react-app/exists`
    //         },
    //         expect.anything(),
    //         expect.anything(),
    //         expect.anything()
    //     )
    //     path.sep = _original_sep
    //     expect(path.sep).toBe(_original_sep)
    // })

    test('npm @namespaces resolve correctly', () => {})

    test('a nested overrides folder path/to/overrides resolves correctly', () => {})
})
