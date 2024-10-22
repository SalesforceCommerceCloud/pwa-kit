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
    '/app/ssr.js': dedent`
        // THIS FILE MOCKS A BARE BONES 'SSR.JS' FILE THAT YOU'D TYPICALLY FIND IN A PWA-KIT APPLICATION
        import {getApplicationExtensions} from './application-extensions-placeholder.js'
    `,
    '/app/main.jsx': dedent`
        // THIS FILE MOCKS A BARE BONES 'SSR.JS' FILE THAT YOU'D TYPICALLY FIND IN A PWA-KIT APPLICATION
        import {getApplicationExtensions} from './application-extensions-placeholder.js'
    `,
    '/app/application-extensions-placeholder.js': '',

    // QUIRK! These entries are required to access the files in the actual file system. The resolve method fails if
    // they don't exist. This is a sharpe edge, but it's not too bad.
    [`${path.resolve(__dirname, './extensions-loader.ts')}`]: '',
    [`${path.resolve(__dirname, '../../../../node_modules/@loadable/component')}`]: ''
}

console.log('path: ', `${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-app'
                )}`)
describe('Application Extension Loader', () => {
    const testCases = [
        // {
        //     description: 'Returns expected file content without empty options',
        //     entryPoint: '/app/main.jsx',
        //     expects: (output, fileStr) => {
        //         const emptyFile = dedent`
        //             const getApplicationExtensions = async () => {
        //                 return []
        //             }
                    
        //             export {
        //                 getApplicationExtensions
        //             }
        //         `
        //         expect(output.modules[1].source).toBe(emptyFile)
        //     },
        //     files: BASE_VIRTUAL_FILES
        // },
        // {
        //     description: 'Loadable is used for web targets.',
        //     entryPoint: '/app/main.jsx',
        //     expects: (output) => {
        //         const emptyFile = dedent`
        //             import loadable from '@loadable/component'


        //             const getApplicationExtensions = async () => {
        //                 return []
        //             }
                    
        //             export {
        //                 getApplicationExtensions
        //             }
        //         `
        //         expect(output.modules[1].source).toBe(emptyFile)
        //     },
        //     files: BASE_VIRTUAL_FILES,
        //     loaderOptions: {
        //         target: 'web'
        //     }
        // },
        {
            description: 'Loadable is used for web targets.',
            entryPoint: '/app/main.jsx',
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
                console.log('output.modules[1].source: ', output.modules[1].source)
                expect(output.modules[1].source).toBe(emptyFile)
            },
            files: {
                ...BASE_VIRTUAL_FILES,
                [`${path.resolve(
                    __dirname,
                    '../../../../node_modules/@salesforce/extension-sample-a/setup-app'
                )}`]: 'asdf'

            },
            loaderOptions: {
                installed: ['@salesforce/extension-sample-a'],
                target: 'web'
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
            console.log('error: ', error)
            expects(output, error)
        })
    })

    // test('Returns single file re-exporting all extensions configured.', async () => {
    //     // const stats = await compiler('mock-extensions.js', {
    //     //     installed: ['@salesforce/extension-this', '@salesforce/extension-that', '@companyx/extension-another', 'extension-this'],
    //     //     configured: [
    //     //         ['@salesforce/extension-this', {path: '/foo'}],
    //     //         '@salesforce/extension-that',
    //     //         '@companyx/extension-another',
    //     //         'extension-this'
    //     //     ],
    //     //     target: 'node'
    //     // })
    //     // const output = stats.toJson({source: true}).modules[1].source

    //     try {
    //         const stats = await runWebpackCompiler(entryPoint, {
    //             files,
    //             buildPlugins: ({fileSystem}) => {
    //                 return [
    //                     {
    //                         test: /\.js$/,
    //                         use: {
    //                             loader: path.resolve(__dirname, '../extensions-loader.js'),
    //                             options
    //                         }
    //                     }
    //                 ]
    //             }
    //         })

    //         // Here we are looking at the first module imported via the wildcard syntax and testing that it's right.
    //         output = stats.toJson({source: true})
    //     } catch (e) {
    //         // err = e
    //         console.log(e)
    //     }

    //     expect(output).toBe(dedent`
    //         /*
    //         * Copyright (c) 2024, salesforce.com, inc.
    //         * All rights reserved.
    //         * SPDX-License-Identifier: BSD-3-Clause
    //         * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
    //         */

    //         // App Extensions
    //         import SalesforceThis from '@salesforce/extension-this/setup-app'
    //         import SalesforceThat from '@salesforce/extension-that/setup-app'
    //         import CompanyxAnother from '@companyx/extension-another/setup-app'
    //         import This from 'extension-this/setup-app'

    //         const installedExtensions = [
    //             {packageName: '@salesforce/extension-this', instanceVariable: SalesforceThis},
    //             {packageName: '@salesforce/extension-that', instanceVariable: SalesforceThat},
    //             {packageName: '@companyx/extension-another', instanceVariable: CompanyxAnother},
    //             {packageName: 'extension-this', instanceVariable: This}
    //         ]

    //         // TODO: Once we create @salesforce/pwa-kit-extensibility we will refactor this code to use a shared utility that
    //         // normalizes/expands the configuration array before it is uses in this loader.
    //         const normalizeExtensionsList = (extensions = []) =>
    //             extensions.map((extension) => {
    //                 return {
    //                     packageName: Array.isArray(extension) ? extension[0] : extension,
    //                     config: Array.isArray(extension) ? {enabled: true, ...extension[1]} : {enabled: true}
    //                 }
    //             })

    //         export const getExtensions = () => {
    //             const configuredExtensions = (normalizeExtensionsList(getConfig()?.app?.extensions) || [])
    //                 .filter((extension) => extension.config.enabled)
    //                 .map((extension) => {
    //                     // Make sure that the configured extensions are installed, before instantiating them
    //                     const found = installedExtensions.find((ext) => ext.packageName === extension.packageName)
    //                     return found ? new found.instanceVariable(extension.config || {}) : false
    //                 })
    //                 .filter(Boolean)

    //             return configuredExtensions
    //         }
    //     `)
    // })
})
