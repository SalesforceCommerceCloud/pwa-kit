/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import * as resolverUtils from './resolver-utils'

describe('resolverUtils', () => {
    describe('"isSelfReference" util returns whether or not a wildcard import is for the same module it is coming from.', () => {
        ;[
            {
                name: 'Importing the wildcard routes from the routes file',
                importPath: 'app/routes',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    '@salesforce',
                    'extension-module-extension-b',
                    'app',
                    'routes.jsx'
                ),

                expected: true
            },
            {
                name: 'Importing a page component from the routes file',
                importPath: 'app/pages/new-home',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    '@salesforce',
                    'extension-module-extension-b',
                    'app',
                    'routes.jsx'
                ),
                expected: false
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.isSelfReference(
                    testCase.importPath,
                    testCase.sourcePath
                )

                expect(result).toEqual(testCase.expected)
            })
        })
    })

    describe('"expand" util returns correct return value when', () => {
        ;[
            {
                name: 'extensions are all short names',
                input: ['module-extension-a', 'module-extension-b', 'module-extension-c'],
                expected: [
                    ['@salesforce/extension-module-extension-a', {}],
                    ['@salesforce/extension-module-extension-b', {}],
                    ['@salesforce/extension-module-extension-c', {}]
                ]
            },
            {
                name: 'extensions are a mix of module extensions and local extension',
                input: ['module-extension-a', 'module-extension-b', './local-extension-c'],
                expected: [
                    ['@salesforce/extension-module-extension-a', {}],
                    ['@salesforce/extension-module-extension-b', {}],
                    [path.join(process.cwd(), 'local-extension-c'), {}]
                ]
            },
            {
                name: 'extensions include falsey values',
                input: ['module-extension-a', '', `.${path.sep}local-extension-c`, false],
                expected: [
                    ['@salesforce/extension-module-extension-a', {}],
                    [path.join(process.cwd(), 'local-extension-c'), {}]
                ]
            },
            {
                name: 'extensions includes absolute path and module path values',
                input: [
                    path.join(process.cwd(), 'local-extension-a'),
                    path.join('@salesforce', 'module-extension-a')
                ],
                expected: [
                    [path.join(process.cwd(), 'local-extension-a'), {}],
                    [path.join('@salesforce', 'module-extension-a'), {}]
                ]
            },
            {
                name: 'extensions includes windows file paths',
                input: ['.\\local-extension-a', '\\home\\local-extension-a'],
                expected: [
                    [path.join(process.cwd(), 'local-extension-a'), {}],
                    [path.join(path.sep, 'home', 'local-extension-a'), {}]
                ]
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.expand(testCase.input)

                expect(result).toEqual(testCase.expected)
            })
        })
    })

    describe('"buildCandidatePaths" util returns array of paths used to module resolving', () => {
        ;[
            {
                name: 'Correct absolute paths are returned with valid input data',
                importPath: '*/app/routes',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    '@salesforce',
                    'pwa-kit-react-sdk',
                    'ssr',
                    'universal',
                    'components',
                    'routes',
                    'index.jsx'
                ),

                extensions: ['module-extension-a', 'module-extension-b', 'module-extension-c'],
                expected: [
                    path.join(process.cwd(), 'app', 'routes'),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        '@salesforce',
                        'extension-module-extension-c',
                        'app',
                        'routes'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        '@salesforce',
                        'extension-module-extension-b',
                        'app',
                        'routes'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        '@salesforce',
                        'extension-module-extension-a',
                        'app',
                        'routes'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        '@salesforce',
                        'pwa-kit-react-sdk',
                        'ssr',
                        'universal',
                        'components',
                        'routes'
                    )
                ]
            },
            {
                name: 'If sourcePath implies a selfreference, only the paths before its first mention is included',
                importPath: '*/app/routes',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    '@salesforce',
                    'extension-module-extension-b',
                    'app',
                    'routes.jsx'
                ),
                extensions: ['module-extension-a', 'module-extension-b'],
                expected: [
                    path.join(
                        process.cwd(),
                        'node_modules',
                        '@salesforce',
                        'extension-module-extension-a',
                        'app',
                        'routes'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        '@salesforce',
                        'pwa-kit-react-sdk',
                        'ssr',
                        'universal',
                        'components',
                        'routes'
                    )
                ]
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.buildCandidatePaths(
                    testCase.importPath,
                    testCase.sourcePath,
                    {extensions: testCase.extensions}
                )

                expect(result).toEqual(testCase.expected)
            })
        })
    })
})
