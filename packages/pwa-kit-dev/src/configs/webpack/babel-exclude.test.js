/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {buildBabelExcludeRegex} from './babel-exclude'

const EXT_EXTENDS = '@salesforce/retail-react-app'

describe('babel-loader exclude regex', () => {
    describe('on Windows (path.sep = backslash)', () => {
        const exclude = buildBabelExcludeRegex('\\', EXT_EXTENDS)

        test('excludes regular node_modules packages', () => {
            expect(exclude.test('C:\\project\\node_modules\\lodash\\index.js')).toBe(true)
        })

        test('does NOT exclude the extends package', () => {
            expect(
                exclude.test(
                    'C:\\project\\node_modules\\@salesforce\\retail-react-app\\app\\index.jsx'
                )
            ).toBe(false)
        })

        test('excludes other @salesforce scoped packages', () => {
            expect(
                exclude.test('C:\\project\\node_modules\\@salesforce\\pwa-kit-runtime\\index.js')
            ).toBe(true)
        })

        test('does not exclude source files outside node_modules', () => {
            expect(exclude.test('C:\\project\\app\\components\\index.jsx')).toBe(false)
        })
    })

    describe('on Unix (path.sep = /)', () => {
        const exclude = buildBabelExcludeRegex('/', EXT_EXTENDS)

        test('excludes regular node_modules packages', () => {
            expect(exclude.test('/home/dev/project/node_modules/lodash/index.js')).toBe(true)
        })

        test('does NOT exclude the extends package', () => {
            expect(
                exclude.test(
                    '/home/dev/project/node_modules/@salesforce/retail-react-app/app/index.jsx'
                )
            ).toBe(false)
        })

        test('excludes other @salesforce scoped packages', () => {
            const p = '/home/dev/project/node_modules/@salesforce/pwa-kit-runtime/index.js'
            expect(exclude.test(p)).toBe(true)
        })

        test('does not exclude source files outside node_modules', () => {
            expect(exclude.test('/home/dev/project/app/components/index.jsx')).toBe(false)
        })
    })
})
