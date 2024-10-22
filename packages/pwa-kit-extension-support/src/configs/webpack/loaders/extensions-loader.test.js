/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import dedent from 'dedent'
import path from 'path'

import {runWebpackCompiler} from '../test-utils'

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
    [`${path.resolve(__dirname, './extensions-loader.ts')}`]: '',
    [`${path.resolve(__dirname, '../../../../node_modules/@loadable/component')}`]: ''
}

describe('Application Extension Loader', () => {
    const testCases = [
        {
            description: 'Returns expected file content without empty options',
            entryPoint: './app/main.jsx',
            expects: (output, fileStr) => {
                const emptyFile = dedent`
                    const getApplicationExtensions = async () => {
                        return []
                    }
                    
                    export {
                        getApplicationExtensions
                    }
                `
                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: BASE_VIRTUAL_FILES
        },
        {
            description: 'Loadable is used for web targets.',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const emptyFile = dedent`
                    import loadable from '@loadable/component'


                    const getApplicationExtensions = async () => {
                        return []
                    }
                    
                    export {
                        getApplicationExtensions
                    }
                `
                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: BASE_VIRTUAL_FILES,
            loaderOptions: {
                target: 'web'
            }
        },
        {
            description: 'Non-configured extensions are not exported (web)',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const emptyFile = dedent`
                    import loadable from '@loadable/component'

                    const SalesforceSampleALoader = loadable.lib(() => import('@salesforce/extension-sample-a/setup-app'))

                    const getApplicationExtensions = async () => {
                        return []
                    }
                    
                    export {
                        getApplicationExtensions
                    }
                `

                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-app'
                )}`]: ''

            },
            loaderOptions: {
                installed: ['@salesforce/extension-sample-a'],
                target: 'web'
            }
        },
        {
            description: 'Non-configured extensions are not exported (node)',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const emptyFile = dedent`
                    import SalesforceSampleA from '@salesforce/extension-sample-a/setup-server'

                    const getApplicationExtensions = () => {
                        return []
                    }
                    
                    export {
                        getApplicationExtensions
                    }
                `

                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-server'
                )}`]: ''
            },
            loaderOptions: {
                installed: ['@salesforce/extension-sample-a'],
                configured: [],
                target: 'node'
            }
        },
        {
            description: 'Loadable is used for web targets.',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const emptyFile = dedent`
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

                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-app'
                )}`]: ''

            },
            loaderOptions: {
                installed: ['@salesforce/extension-sample-a'],
                configured: [['@salesforce/extension-sample-a', {enabled: true}]],
                target: 'web'
            }
        },
        {
            description: 'Loadable is not used for node targets.',
            entryPoint: './app/main.jsx',
            expects: (output) => {
                const emptyFile = dedent`
                    import SalesforceSampleA from '@salesforce/extension-sample-a/setup-server'

                    const getApplicationExtensions = () => {
                        return [new SalesforceSampleA({"enabled":true})]
                    }
                    
                    export {
                        getApplicationExtensions
                    }
                `

                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-server'
                )}`]: ''

            },
            loaderOptions: {
                installed: ['@salesforce/extension-sample-a'],
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
                            '../../../../node_modules/@loadable/component'
                        )
                    },
                    files,
                    buildLoaders: () => [
                        {
                            test: /application-extensions-placeholder.js/i,
                            use: {
                                loader: path.resolve(__dirname, './extensions-loader.ts'),
                                options: loaderOptions
                            }
                        }
                    ]
                })

                // Here we are looking at the first module imported via the wildcard syntax and testing that it's right.
                output = stats.toJson({source: true})
            } catch (e) {
                error = e
            }

            expects(output, error)
        })
    })

})
