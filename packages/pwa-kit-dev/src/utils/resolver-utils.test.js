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
                    '@salesforce/extension-module-extension-a',
                    '@salesforce/extension-module-extension-b',
                    '@salesforce/extension-module-extension-c'
                ]
            },
            {
                name: 'extensions are a mix of module extensions and local extension',
                input: ['module-extension-a', 'module-extension-b', './local-extension-c'],
                expected: [
                    '@salesforce/extension-module-extension-a',
                    '@salesforce/extension-module-extension-b',
                    './local-extension-c'
                ]
            },
            {
                name: 'extensions include falsey values',
                input: ['module-extension-a', '', './local-extension-c', false],
                expected: ['@salesforce/extension-module-extension-a', './local-extension-c']
            }
        ].forEach((testCase) => {
            test(`${testCase.name}`, () => {
                const result = resolverUtils.expand(testCase.input)

                expect(result).toEqual(testCase.expected)
            })
        })
    })
})
