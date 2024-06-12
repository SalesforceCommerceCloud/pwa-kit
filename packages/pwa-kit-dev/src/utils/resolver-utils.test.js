/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as resolverUtils from './resolver-utils'

describe('resolverUtils', () => {
    describe('"expand" util returns correct return value when', () => {
        ;[
            {
                name: 'extensions are all module extensions',
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
                    [`${process.cwd()}/local-extension-c`, {}]
                ]
            },
            {
                name: 'extensions include falsey values',
                input: ['module-extension-a', '', './local-extension-c', false],
                expected: [
                    ['@salesforce/extension-module-extension-a', {}],
                    [`${process.cwd()}/local-extension-c`, {}]
                ]
            },
            {
                name: 'extensions includes absolute values',
                input: [`${process.cwd()}/local-extension-a`],
                expected: [[`${process.cwd()}/local-extension-a`, {}]]
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.expand(testCase.input)

                expect(result).toEqual(testCase.expected)
            })
        })
    })

    describe('"buildCandidatePathArray" util returns array of paths used to module resolving', () => {
        ;[
            {
                name: 'Correct absolute paths are returned with valid input data',
                importPath: '*/app/routes',
                sourcePath: `${process.cwd()}/node_modules/@salesforce/pwa-kit-react-sdk/ssr/universal/components/routes/index.jsx`,
                extensions: ['module-extension-a', 'module-extension-b', 'module-extension-c'],
                expected: [
                    `${process.cwd()}/app/routes`,
                    `${process.cwd()}/node_modules/@salesforce/extension-module-extension-c/app/routes`,
                    `${process.cwd()}/node_modules/@salesforce/extension-module-extension-b/app/routes`,
                    `${process.cwd()}/node_modules/@salesforce/extension-module-extension-a/app/routes`,
                    `${process.cwd()}/node_modules/@salesforce/pwa-kit-react-sdk/ssr/universal/components/routes`
                ]
            },
            {
                name: 'If sourcePath implies a selfreference, only the paths before its first mention is included',
                importPath: '*/app/routes',
                sourcePath: `${process.cwd()}/node_modules/@salesforce/extension-module-extension-b/app/routes.jsx`,
                extensions: ['module-extension-a', 'module-extension-b'],
                expected: [
                    `${process.cwd()}/node_modules/@salesforce/extension-module-extension-a/app/routes`,
                    `${process.cwd()}/node_modules/@salesforce/pwa-kit-react-sdk/ssr/universal/components/routes`
                ]
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.buildCandidatePathArray(
                    testCase.importPath,
                    testCase.sourcePath,
                    {extensions: testCase.extensions}
                )

                expect(result).toEqual(testCase.expected)
            })
        })
    })
})
