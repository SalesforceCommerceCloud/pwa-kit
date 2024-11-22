/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import dedent from 'dedent'
import path from 'path'

import {runWebpackCompiler} from './test-utils'
import {ruleForApplicationExtensibility} from './application-extensions-loader'

const BASE_VIRTUAL_FILES = {
    // Virtual Project Files
    './app/ssr.js': dedent`
        // THIS FILE MOCKS A BARE BONES 'SSR.JS' FILE THAT YOU'D TYPICALLY FIND IN A PWA-KIT APPLICATION
        import {getApplicationExtensions} from './application-extensions-placeholder.js'
    `,
    './app/main.jsx': dedent`
        // THIS FILE MOCKS A BARE BONES 'SSR.JS' FILE THAT YOU'D TYPICALLY FIND IN A PWA-KIT APPLICATION
        import {getApplicationExtensions} from './application-extensions-placeholder.js'
    `,
    './app/application-extensions-placeholder.js': '',

    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
    // they don't exist. This is a sharpe edge, but it's not too bad.
    [`${path.resolve(__dirname, './application-extensions-loader.ts')}`]: '',
    [`${path.resolve(__dirname, '../../../node_modules/@loadable/component')}`]: ''
}

describe('Application Extension Loader', () => {
    const testCases = [
        {
            description: 'Without target and configured extensions, returns expected file content',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const file = dedent`
                    const getApplicationExtensions = async () => {
                        return []
                    }

                    export {
                        getApplicationExtensions
                    }
                `
                expect(output.modules[1].source).toBe(file)
            },
            files: BASE_VIRTUAL_FILES
        },
        {
            description:
                'If web target, uses loadable and certain logic for getApplicationExtensions',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const file = dedent`
                    import loadable from '@loadable/component'

                    const SalesforceSampleALoader = loadable.lib(() => import('@salesforce/extension-sample-a/setup-app'))

                    const getApplicationExtensions = async () => {
                        const modules = await Promise.all([SalesforceSampleALoader.load()])
                        return [new modules[0].default({"enabled":true})]
                    }

                    export {
                        getApplicationExtensions
                    }
                `
                expect(output.modules[1].source).toBe(file)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-app'
                )}`]: ''
            },
            loaderOptions: {
                configured: [['@salesforce/extension-sample-a', {enabled: true}]],
                target: 'web'
            }
        },
        {
            description: 'If node target, uses certain logic for getApplicationExtensions',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const file = dedent`
                    import SalesforceSampleA from '@salesforce/extension-sample-a/setup-server'

                    const getApplicationExtensions = () => {
                        return [new SalesforceSampleA({"enabled":true})]
                    }

                    export {
                        getApplicationExtensions
                    }
                `
                expect(output.modules[1].source).toBe(file)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-server'
                )}`]: ''
            },
            loaderOptions: {
                configured: [['@salesforce/extension-sample-a', {enabled: true}]],
                target: 'node'
            }
        }
    ]

    testCases.forEach((options) => {
        const {description, entryPoint, files, expects, loaderOptions} = options

        test(`${description}`, async () => {
            let output, error

            try {
                const stats = await runWebpackCompiler(entryPoint, {
                    alias: {
                        '@loadable/component$': path.resolve(
                            __dirname,
                            '../../../node_modules/@loadable/component'
                        )
                    },
                    files,
                    buildLoaders: () => [
                        {
                            test: /application-extensions-placeholder.js/i,
                            use: {
                                loader: path.resolve(
                                    __dirname,
                                    './application-extensions-loader.ts'
                                ),
                                options: loaderOptions
                            }
                        }
                    ]
                })

                // Here we are looking at the first module imported via the wildcard syntax and testing that it's right.
                output = stats.toJson({source: true})
            } catch (e) {
                console.error(e)
                error = e
            }

            expects(output, error)
        })
    })
})

describe('ruleForApplicationExtensibility', () => {
    test('without any arguments, uses the node target', () => {
        const result = ruleForApplicationExtensibility()
        expect(result.use.options.target).toBe('node')
    })
})
