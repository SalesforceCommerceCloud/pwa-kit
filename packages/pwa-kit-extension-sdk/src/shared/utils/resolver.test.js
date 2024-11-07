/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import * as resolverUtils from './resolver'

const PROJECT_PATH_GOOD = '/home/user/testproject'
const PROJECT_PATH_BAD = '/home/user/test.project'

describe('resolverUtils', () => {
    describe('"isSelfReference" util returns whether or not a dollar-prefixed import is for the same module it is coming from.', () => {
        ;[
            {
                name: 'Importing the dollar-prefixed routes from the routes file',
                importPath: 'app/routes',
                sourcePath: path.join(
                    PROJECT_PATH_GOOD,
                    'node_modules',
                    '@salesforce',
                    'extension-module-extension-b',
                    'src',
                    'overrides',
                    'app',
                    'routes.jsx'
                ),
                expected: true
            },
            {
                name: 'Importing the dollar-prefixed routes from the routes file where project path has dots in it',
                importPath: 'app/routes',
                sourcePath: path.join(
                    PROJECT_PATH_BAD,
                    'node_modules',
                    '@salesforce',
                    'extension-module-extension-b',
                    'src',
                    'overrides',
                    'app',
                    'routes.jsx'
                ),
                expected: true
            },
            {
                name: 'Importing a page component from the routes file',
                importPath: 'app/pages/new-home',
                sourcePath: path.join(
                    PROJECT_PATH_GOOD,
                    'node_modules',
                    '@salesforce',
                    'extension-module-extension-b',
                    'src',
                    'overrides',
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

    describe('"buildCandidatePaths" util returns array of paths used to module resolving', () => {
        ;[
            {
                name: 'Correct paths are returned when dollar-prefixed import is used in an application extension',
                importPath: '$/pages/sample',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    'extension-a',
                    'src',
                    'setup-app.ts'
                ),

                extensions: ['extension-a', 'extension-b', 'extension-c'],
                expected: [
                    path.join(process.cwd(), 'app', 'overrides', 'pages', 'sample'),
                    path.join(process.cwd(), 'app', 'pages', 'sample'),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-c',
                        'src',
                        'overrides',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-c',
                        'src',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-b',
                        'src',
                        'overrides',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-b',
                        'src',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-a',
                        'src',
                        'overrides',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-a',
                        'src',
                        'pages',
                        'sample'
                    )
                ]
            },
            {
                name: 'Correct paths are returned when "some" extensions are disabled',
                importPath: '$/pages/sample',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    'extension-a',
                    'src',
                    'setup-app.ts'
                ),

                extensions: ['extension-a', 'extension-b', ['extension-c', {enabled: false}]],
                expected: [
                    path.join(process.cwd(), 'app', 'overrides', 'pages', 'sample'),
                    path.join(process.cwd(), 'app', 'pages', 'sample'),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-b',
                        'src',
                        'overrides',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-b',
                        'src',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-a',
                        'src',
                        'overrides',
                        'pages',
                        'sample'
                    ),
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-a',
                        'src',
                        'pages',
                        'sample'
                    )
                ]
            },
            {
                name: 'Correct paths are returned when "all" extensions are disabled',
                importPath: '$/pages/sample',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    'extension-a',
                    'src',
                    'setup-app.ts'
                ),

                extensions: [
                    ['extension-a', {enabled: false}],
                    ['extension-b', {enabled: false}],
                    ['extension-c', {enabled: false}]
                ],
                expected: [
                    path.join(process.cwd(), 'app', 'overrides', 'pages', 'sample'),
                    path.join(process.cwd(), 'app', 'pages', 'sample')
                ]
            },
            {
                name: 'If sourcePath implies a self-reference, only the paths before its first mention are included',
                importPath: '$/app/routes',
                sourcePath: path.join(
                    process.cwd(),
                    'node_modules',
                    'extension-b',
                    'src',
                    'overrides',
                    'app',
                    'routes.jsx'
                ),
                extensions: ['extension-a', 'extension-b'],
                expected: [
                    path.join(
                        process.cwd(),
                        'node_modules',
                        'extension-a',
                        'src',
                        'overrides',
                        'app',
                        'routes'
                    ),
                    path.join(process.cwd(), 'node_modules', 'extension-a', 'src', 'app', 'routes')
                ]
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.buildCandidatePaths(
                    testCase.importPath,
                    testCase.sourcePath,
                    {extensionEntries: testCase.extensions}
                )

                expect(result).toEqual(testCase.expected)
            })
        })
    })
})
