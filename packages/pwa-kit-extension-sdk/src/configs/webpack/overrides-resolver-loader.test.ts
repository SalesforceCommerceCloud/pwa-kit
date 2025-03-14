/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import {runWebpackCompiler} from './test-utils'
import {validateOverrideSource, __OVERRIDABLE_CACHE__} from './overrides-resolver-loader'
import OverrideStatsPlugin, {OverrideStatsEntry} from './override-stats-plugin'

declare module 'webpack' {
    interface Compilation {
        overrideStats?: OverrideStatsEntry[]
    }
}

// DEVELOPER NOTE:
// This loader is intended to be used as an "inline" loader, meaning that you don't typically see it configured
// in the webpack configuration. Because we are using a memory filesystem for testind we need a way to pass that
// file system into the loader so it can be used in the resolve method. For that reason we have to do the testing
// here by initializing a loader object and singling out the file we want to use that loader for by use a "test"
// definition.

class ApplicationExtensionConfigPlugin {
    private options: any

    constructor(options: any) {
        this.options = options
    }

    apply(compiler: any) {
        compiler.hooks.initialize.tap('ApplicationExtensionConfigPlugin', () => {
            // TODO: We are calling this alot, lets do it one time at the top of this file.
            compiler.custom = {
                extensions: this.options.extensions
            }
        })
    }
}

describe('Overrides Resolver Loader', () => {
    const testCases = [
        {
            bypassWindows: true,
            description: 'imports prioritizes base project overrides',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            // Compiler configuration.
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}],
                    ['@salesforce/extension-other', {enabled: true}]
                ],
                files: {
                    // Virtual Project Files

                    // Overrides

                    // Local project with overrides
                    '/app/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// Base Project - Sample Page',

                    // Extensions with overrides
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-that',
                    '/node_modules/@salesforce/extension-other/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-other',

                    // Extension using overridable import
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx':
                        '// @salesforce/extension-this',
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',

                    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
                    // they don't exist. This is a sharpe edge, but it's not too bad.
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                }
            },
            expects: (output: any) => {
                expect(output.modules[1].source).toBe('// Base Project - Sample Page')
                // Verify stats
                const stats = output.overrideStats
                expect(stats).toHaveLength(1)
                expect(stats[0]).toMatchObject({
                    sourceExtension: '@salesforce/extension-this',
                    original: expect.stringContaining('extension-this/src/pages/sample-page'),
                    resolved: expect.stringContaining(
                        'app/overrides/@salesforce/extension-this/pages/sample-page'
                    )
                })
            }
        },
        {
            bypassWindows: true,
            description: 'imports can be overridden from extensions',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            // Compiler configuration.
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}],
                    ['@salesforce/extension-other', {enabled: true}]
                ],
                files: {
                    // Virtual Project Files

                    // Overrides

                    // Extensions with overrides
                    '/node_modules/@salesforce/extension-other/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-other',
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-that',

                    // Extension using overridable import
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx':
                        '// @salesforce/extension-this',
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',

                    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
                    // they don't exist. This is a sharpe edge, but it's not too bad.
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                }
            },
            expects: (output: any) => {
                expect(output.modules[1].source).toBe('// @salesforce/extension-other')
                const stats = output.overrideStats
                expect(stats).toHaveLength(1)
                expect(stats[0]).toMatchObject({
                    sourceExtension: '@salesforce/extension-this',
                    original: expect.stringContaining('extension-this/src/pages/sample-page'),
                    resolved: expect.stringContaining(
                        'extension-other/src/overrides/@salesforce/extension-this/pages/sample-page'
                    )
                })
            }
        },
        {
            bypassWindows: true,
            description: 'imports are effected by the extension order.',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            // Compiler configuration.
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-other', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}]
                ],
                files: {
                    // Virtual Project Files

                    // Overrides

                    // Extensions with overrides
                    '/node_modules/@salesforce/extension-other/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-other',
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-that',

                    // Extension using overridable import
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx':
                        '// @salesforce/extension-this',
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',

                    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
                    // they don't exist. This is a sharpe edge, but it's not too bad.
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                }
            },
            expects: (output: any) => {
                expect(output.modules[1].source).toBe('// @salesforce/extension-that')
            }
        },
        {
            bypassWindows: true,
            description: 'imports throws when no override is found.',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            // Compiler configuration.
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-other', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}]
                ],
                files: {
                    // Virtual Project Files

                    // Overrides

                    // Extension using overridable import
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',

                    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
                    // they don't exist. This is a sharpe edge, but it's not too bad.
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                }
            },
            expects: (_: any, err: any) => {
                expect(err).toBeDefined()
            }
        },
        {
            bypassWindows: true,
            description:
                'imports can be overridden from extensions and the override can use relative paths',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            // Compiler configuration.
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}]
                ],
                files: {
                    // Virtual Project Files

                    // Overrides

                    // Extensions with overrides
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page.jsx': `
                            // @salesforce/extension-that
                            import Test from './sample-page-dependency'
                        `,
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page-dependency.js': `
                            // Should Be Referenced
                            export default {}
                        `,

                    // Extension using overridable import
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx': `
                            // @salesforce/extension-this
                            import Test from './sample-page-dependency'
                        `,
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page-dependency.js': `
                            // Should Not Be Referenced
                            export default {}
                        `,
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',

                    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
                    // they don't exist. This is a sharpe edge, but it's not too bad.
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                }
            },
            expects: (output: any) => {
                expect(output.modules[2].source).toContain('// Should Be Referenced')
            }
        },
        {
            bypassWindows: true,
            description: 'records override stats correctly',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}]
                ],
                files: {
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-that',
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx':
                        '// @salesforce/extension-this',
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                },
                recordStats: true
            },
            expects: (output: any) => {
                expect(output.overrideStats).toHaveLength(1)
                expect(output.overrideStats[0]).toMatchObject({
                    sourceExtension: '@salesforce/extension-this',
                    original: expect.stringContaining('extension-this/src/pages/sample-page'),
                    resolved: expect.stringContaining(
                        'extension-that/src/overrides/@salesforce/extension-this/pages/sample-page'
                    )
                })
            }
        },
        {
            bypassWindows: true,
            description: 'does not record stats when overrideStats is not present',
            entryPoint: '/node_modules/@salesforce/extension-this/src/setup-app.js',
            loaderTest: /node_modules\/@salesforce\/extension-this\/src\/pages\/sample-page/i,
            compilerConfig: {
                extensions: [
                    ['@salesforce/extension-this', {enabled: true}],
                    ['@salesforce/extension-that', {enabled: true}]
                ],
                files: {
                    '/node_modules/@salesforce/extension-that/src/overrides/@salesforce/extension-this/pages/sample-page.jsx':
                        '// @salesforce/extension-that',
                    '/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx':
                        '// @salesforce/extension-this',
                    '/node_modules/@salesforce/extension-this/package.json':
                        '{"name": "@salesforce/extension-this"}',
                    '/node_modules/@salesforce/extension-this/src/setup-app.js':
                        'import Page from "./pages/sample-page"',
                    [`${path.resolve(__dirname, './overrides-resolver-loader.ts')}`]: ''
                },
                recordStats: false
            },
            expects: (output: any) => {
                expect(output.overrideStats).toBeUndefined()
            }
        }
    ]

    describe('overridable!', () => {
        testCases.forEach((options: any) => {
            const {compilerConfig, description, entryPoint, expects, loaderTest, bypassWindows} =
                options
            const {extensions, files, recordStats = true} = compilerConfig

            test(`${description as string}`, async () => {
                let output, error

                try {
                    const stats = await runWebpackCompiler(entryPoint, {
                        files,
                        buildPlugins: () => [
                            new ApplicationExtensionConfigPlugin({extensions}),
                            ...(recordStats ? [new OverrideStatsPlugin()] : [])
                        ],
                        buildLoaders: ({fileSystem}: any) => [
                            {
                                test: loaderTest,
                                use: {
                                    loader: path.resolve(
                                        __dirname,
                                        './overrides-resolver-loader.ts'
                                    ),
                                    options: {
                                        baseDir: '/',
                                        resolveOptions: {
                                            // Override the `fs` methods used by `resolve` to point to the virtual file system
                                            existsSync: (filePath: string) => {
                                                return fileSystem.existsSync(filePath)
                                            },
                                            readFile: (
                                                filePath: string,
                                                encoding: string,
                                                cb: any
                                            ) => {
                                                try {
                                                    const data = fileSystem.readFileSync(
                                                        filePath,
                                                        encoding
                                                    )
                                                    cb(null, data)
                                                } catch (err) {
                                                    cb(err)
                                                }
                                            },
                                            readFileSync: (filePath: string, encoding: string) => {
                                                return fileSystem.readFileSync(filePath, encoding)
                                            },
                                            isFile: (filePath: string) => {
                                                try {
                                                    return fileSystem.statSync(filePath).isFile()
                                                } catch (e) {
                                                    return false
                                                }
                                            },
                                            isDirectory: (dirPath: string) => {
                                                try {
                                                    return fileSystem
                                                        .statSync(dirPath)
                                                        .isDirectory()
                                                } catch (e) {
                                                    return false
                                                }
                                            },
                                            realpath: (filePath: string, cb: any) => {
                                                // In the virtual file system, the real path is just the file path itself
                                                cb(null, filePath)
                                            },
                                            realpathSync: (filePath: string) => filePath // Sync version
                                        }
                                    }
                                }
                            }
                        ]
                    })

                    // Here we are looking at the first module imported via an overridable import and testing that it's right.
                    output = stats?.toJson({source: true})
                    output.overrideStats = stats.compilation.overrideStats
                } catch (e) {
                    error = e
                }

                // NOTE: We are going to bypass windows tests in order to get CI happy. We have created a ticket to fix this test. There
                // are 2 approaches we can look at, 1. have windows specific paths in this test file 2. leave paths as is, and ensure our
                // implementation allows use to configure the path separator.
                if (bypassWindows && process.platform === 'win32') {
                    // eslint-disable-next-line jest/no-conditional-expect
                    expect(true).toBe(true)
                    return
                }

                expects(output, error)
            })
        })
    })
})

describe('validateOverrideSource', () => {
    beforeEach(() => {
        // Clear the target cache before each test
        __OVERRIDABLE_CACHE__.node = []
        __OVERRIDABLE_CACHE__.web = []
    })

    it('should return false if the file has already been processed', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa-kit-app',
            'node_modules',
            '@salesforce',
            'extension-sample',
            'src',
            'pages',
            'home.js'
        )

        // Mock the file being processed bup adding it to the cache
        __OVERRIDABLE_CACHE__.node.push(source)

        const result = validateOverrideSource(source, {
            target: 'node',
            overridables: [path.join('@salesforce', 'extension-sample', 'src', 'pages', 'home.js')]
        })
        expect(result).toBe(false)
    })

    it('should return false if the file is not an extension file', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa',
            'node_modules',
            'not-extension-sample',
            'src',
            'setup-app.js'
        )

        const result = validateOverrideSource(source, {target: 'node'})
        expect(result).toBe(false)
    })

    it('should return false if the file is a setup file', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa',
            'node_modules',
            'extension-sample',
            'src',
            'setup-app.js'
        )

        const result = validateOverrideSource(source, {target: 'node'})
        expect(result).toBe(false)
    })

    it('should return false if the normalized source is not in the list of overridables', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa',
            'node_modules',
            'extension-sample',
            'src',
            'pages',
            'home.js'
        )

        const result = validateOverrideSource(source, {
            target: 'node',
            overridables: []
        })
        expect(result).toBe(false)
    })

    it('should return true and add the source to the cache if it is an overridable file', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa-kit',
            'packages',
            'extension-sample',
            'src',
            'pages',
            'home.js'
        )
        const overridables = [
            `./node_modules/${path.posix.join(
                '@salesforce',
                'extension-sample',
                'src',
                'pages',
                'home.js'
            )}`
        ]

        const result = validateOverrideSource(source, {
            isMonoRepo: true,
            target: 'node',
            overridables
        })

        expect(result).toBe(true)
    })

    it('should handle non-mono-repo sources correctly', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa',
            'node_modules',
            'extension-sample',
            'src',
            'pages',
            'home.js'
        )
        const overridables = [
            `./node_modules/${path.posix.join('extension-sample', 'src', 'pages', 'home.js')}`
        ]

        const result = validateOverrideSource(source, {
            isMonoRepo: false,
            target: 'node',
            overridables
        })

        expect(result).toBe(true)
    })

    it('source cache is per target', () => {
        const source = path.join(
            path.sep,
            'projects',
            'pwa-kit',
            'packages',
            'extension-sample',
            'src',
            'pages',
            'home.js'
        )
        const overridables = [
            `./node_modules/${path.posix.join(
                '@salesforce',
                'extension-sample',
                'src',
                'pages',
                'home.js'
            )}`
        ]

        const resultWeb = validateOverrideSource(source, {
            isMonoRepo: true,
            target: 'web',
            overridables
        })
        const resultNode = validateOverrideSource(source, {
            isMonoRepo: true,
            target: 'node',
            overridables
        })

        expect(resultWeb).toBe(true)
        expect(resultNode).toBe(true)
    })
})
