/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {BASE_DIR, runWebpackCompiler} from '../test-utils'
import OverridesResolverPlugin from './overrides-resolver-plugin'

describe('Overrides Resolver Plugin', () => {
    const testCases = [
        {
            description: 'Wildcard import resolved to correct extension override',
            entryPoint: 'app/routes.jsx',
            // Compiler configuration.
            compilerConfig: {
                extensions: ['@salesforce/extension-this', '@salesforce/extension-that'],
                files: {
                    // Virtual Project Files

                    // Entry Point
                    '/virtual/project/app/routes.jsx': `import SamplePage from '*/pages/sample-page'`,

                    // Overrides

                    // Local Files
                    '/virtual/project/app/pages/sample-page.jsx': '// Sample Page',

                    // Extensions Overrides
                    '/virtual/project/node_modules/@salesforce/extension-that/src/overrides/pages/sample-page.jsx':
                        '// @salesforce/extension-that',
                    '/virtual/project/node_modules/@salesforce/extension-this/src/overrides/pages/sample-page.jsx':
                        '// @salesforce/extension-this'
                    // TODO: Why don't index files work here?
                }
            },
            expects: (output) => {
                expect(output.modules[1].source).toBe('// @salesforce/extension-that')
            }
        },
        {
            description:
                'Wildcard import resolved to correct extension override when app extension is reversed',
            entryPoint: 'app/routes.jsx',
            // Compiler configuration.
            compilerConfig: {
                extensions: ['@salesforce/extension-that', '@salesforce/extension-this'],
                files: {
                    // Virtual Project Files

                    // Entry Point
                    '/virtual/project/app/routes.jsx': `import SamplePage from '*/pages/sample-page'`,

                    // Overrides

                    // Local Files
                    '/virtual/project/app/pages/sample-page.jsx': '// Sample Page',

                    // Extensions Overrides
                    '/virtual/project/node_modules/@salesforce/extension-that/src/overrides/pages/sample-page.jsx':
                        '// @salesforce/extension-that',
                    '/virtual/project/node_modules/@salesforce/extension-this/src/overrides/pages/sample-page.jsx':
                        '// @salesforce/extension-this'
                    // TODO: Why don't index files work here?
                }
            },
            expects: (output) => {
                expect(output.modules[1].source).toBe('// @salesforce/extension-this')
            }
        },
        {
            description:
                'Wildcard import pioritizes module resolution to the "overrides" folder if match import exists.',
            entryPoint: 'app/routes.jsx',
            // Compiler configuration.
            compilerConfig: {
                extensions: ['@salesforce/extension-that', '@salesforce/extension-this'],
                files: {
                    // Virtual Project Files

                    // Entry Point
                    '/virtual/project/app/routes.jsx': `import SamplePage from '*/pages/sample-page'`,

                    // Overrides

                    // Local Files
                    '/virtual/project/app/pages/sample-page.jsx': '// Sample Page',

                    // Extensions Overrides
                    '/virtual/project/node_modules/@salesforce/extension-this/src/pages/sample-page.jsx':
                        '// @salesforce/extension-this',
                    '/virtual/project/node_modules/@salesforce/extension-this/src/overrides/pages/sample-page.jsx':
                        '// @salesforce/extension-this-override'
                    // TODO: Why don't index files work here?
                }
            },
            expects: (output) => {
                expect(output.modules[1].source).toBe('// @salesforce/extension-this-override')
            }
        },
        {
            description: 'Wildcard import throws when no match is found.',
            entryPoint: 'app/routes.jsx',
            // Compiler configuration.
            compilerConfig: {
                extensions: ['@salesforce/extension-that', '@salesforce/extension-this'],
                files: {
                    // Virtual Project Files

                    // Entry Point
                    '/virtual/project/app/routes.jsx': `import SamplePage from '*/pages/sample-page'`

                    // Overrides
                }
            },
            expects: (_, err) => {
                // console.log('output: ', output)
                expect(err).toBeDefined()
            }
        }
    ]

    testCases.forEach((options) => {
        const {compilerConfig, description, entryPoint, expects} = options
        const {extensions, files} = compilerConfig

        test(`${description}`, async () => {
            let output, err

            try {
                const stats = await runWebpackCompiler(entryPoint, {
                    files,
                    buildPlugins: ({fileSystem}) => {
                        return [
                            new OverridesResolverPlugin({
                                projectDir: BASE_DIR,
                                extensions: extensions,
                                fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
                                resolveOptions: {
                                    // Override the `fs` methods used by `resolve` to point to the virtual file system
                                    readFile: (filePath, encoding, cb) => {
                                        try {
                                            const data = fileSystem.readFileSync(filePath, encoding)
                                            cb(null, data)
                                        } catch (err) {
                                            cb(err)
                                        }
                                    },
                                    isFile: (filePath) => {
                                        try {
                                            return fileSystem.statSync(filePath).isFile()
                                        } catch (e) {
                                            return false
                                        }
                                    },
                                    isDirectory: (dirPath) => {
                                        try {
                                            return fileSystem.statSync(dirPath).isDirectory()
                                        } catch (e) {
                                            return false
                                        }
                                    },
                                    realpath: (filePath, cb) => {
                                        // In the virtual file system, the real path is just the file path itself
                                        cb(null, filePath)
                                    },
                                    realpathSync: (filePath) => filePath // Sync version
                                }
                            })
                        ]
                    }
                })

                // Here we are looking at the first module imported via the wildcard syntax and testing that it's right.
                output = stats.toJson({source: true})
            } catch (e) {
                err = e
            }

            expects(output, err)
        })
    })
})
