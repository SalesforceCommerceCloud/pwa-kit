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
    ['newExtension', ['src/configs/webpack/test/overrides/newExtension.tsx', ['.', 'tsx']]],
    ['path/data', ['src/configs/webpack/test/overrides/path/data.js', ['.', 'js']]],
    ['path', ['/index.jsx', ['index', '.', 'jsx']]],
    ['path/index.mock', ['/index.mock.jsx', ['.', 'jsx']]],
    ['path/nested/icon', ['src/configs/webpack/test/overrides/path/nested/icon.svg', ['.', 'svg']]]
])
const EXTENDS_TARGET = '@salesforce/retail-react-app'
const REWRITE_DIR = 'src/configs/webpack/test/overrides'
const options = {
    overridesDir: '/overrides',
    extends: ['@salesforce/retail-react-app'],
    projectDir: PROJECT_DIR
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./', 'node_modules', EXTENDS_TARGET),
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
                    issuer: path.join('./', 'fake-file.js')
                },
                path: path.join(REWRITE_DIR, REQUEST_PATH + REQUEST_EXTENSION),
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
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./', 'node_modules', EXTENDS_TARGET),
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
                    issuer: path.join('./', 'fake-file.js')
                },
                path: path.join(REWRITE_DIR, REQUEST_PATH + REQUEST_EXTENSION),
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}${REQUEST_EXTENSION}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('resolver doResolve() hook is NOT called for files NOT in overrides dir', () => {
        const REQUEST_PATH = `path/nested/does_not_exist.svg`
        const REQUEST_EXTENSION = '.svg'
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./', 'node_modules', EXTENDS_TARGET),
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
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./', 'node_modules', EXTENDS_TARGET),
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
                    issuer: path.join('./', 'fake-file.js')
                },
                path: path.join(REWRITE_DIR, REQUEST_ONE_PATH + REQUEST_ONE_EXTENSION),
                request: `${EXTENDS_TARGET}/exists`
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
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./'),
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

    test('jsx base template files can be replaced by tsx files', () => {
        const REQUEST_PATH = 'newExtension'
        const REQUEST_BASE_EXTENSION = '.jsx'
        const REQUEST_OVERRIDE_EXTENSION = '.tsx'

        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join(
                './',
                'node_modules',
                EXTENDS_TARGET,
                REQUEST_PATH,
                REQUEST_BASE_EXTENSION
            ),
            request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
        }

        let {resolver, callback} = setupResolverAndCallback(
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
                    issuer: path.join('./', 'fake-file.js')
                },
                path: path.join(REWRITE_DIR, REQUEST_PATH + REQUEST_OVERRIDE_EXTENSION),
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('overridesDir and projectDir are normalized with leading slash and forward slashes', () => {
        // In this test, all inputs use \\ to simulate Windows file paths
        const REQUEST_PATH = 'exists'
        const REQUEST_EXTENSION = '.jsx'
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: '.\\fake-file.js'
            },
            path: '.\\node_modules\\' + EXTENDS_TARGET,
            request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
        }

        const {resolver, callback} = setupResolverAndCallback(
            null,
            testRequestContext,
            null,
            {},
            callback
        )

        const windowsOptions = {
            overridesDir: '\\overrides',
            extends: ['@salesforce/retail-react-app'],
            projectDir: `src\\configs\\webpack\\test`
        }

        const overridesResolver = new OverridesResolverPlugin(windowsOptions)
        overridesResolver.handleHook(testRequestContext, {}, callback, resolver)

        expect(callback).toHaveBeenCalled()
        expect(resolver.ensureHook).toHaveBeenCalled()

        // The assert uses path.join which normalizes '\\' to '/' on non-Windows
        // We expect issuer to remain unchanged since we do not modify it
        expect(resolver.doResolve).toHaveBeenCalledWith(
            null,
            {
                _ResolverCachePluginCacheMiss: true,
                context: {
                    issuer: '.\\fake-file.js'
                },
                path: path.join(REWRITE_DIR, REQUEST_PATH + REQUEST_EXTENSION),
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('overrides do not return .mock files', () => {
        // FS_READ_HASHMAP above has both index.jsx and index.mock.jsx
        // This test checks that index.jsx is returned by the override
        const REQUEST_PATH = `path`
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./', 'node_modules', EXTENDS_TARGET),
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
                    issuer: path.join('./', 'fake-file.js')
                },
                path: path.join(REWRITE_DIR, REQUEST_PATH + `/index.jsx`),
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })

    test('a nested overrides folder path/to/overrides resolves correctly', () => {
        const REQUEST_PATH = 'exists'
        const REQUEST_EXTENSION = '.jsx'
        const testRequestContext = {
            _ResolverCachePluginCacheMiss: true,
            context: {
                issuer: path.join('./', 'fake-file.js')
            },
            path: path.join('./', 'node_modules', EXTENDS_TARGET),
            request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
        }

        const {resolver, callback} = setupResolverAndCallback(
            null,
            testRequestContext,
            null,
            {},
            callback
        )

        const nestedOverridesOptions = {
            overridesDir: '/path/to/overrides',
            extends: ['@salesforce/retail-react-app'],
            projectDir: PROJECT_DIR
        }

        const overridesResolver = new OverridesResolverPlugin(nestedOverridesOptions)
        overridesResolver.handleHook(testRequestContext, {}, callback, resolver)

        const nestedRewriteDir = 'src/configs/webpack/test/path/to/overrides'

        expect(callback).toHaveBeenCalled()
        expect(resolver.ensureHook).toHaveBeenCalled()
        expect(resolver.doResolve).toHaveBeenCalledWith(
            null,
            {
                _ResolverCachePluginCacheMiss: true,
                context: {
                    issuer: path.join('./', 'fake-file.js')
                },
                path: path.join(nestedRewriteDir, REQUEST_PATH + REQUEST_EXTENSION),
                request: `${EXTENDS_TARGET}/${REQUEST_PATH}`
            },
            expect.anything(),
            expect.anything(),
            expect.anything()
        )
    })
})
