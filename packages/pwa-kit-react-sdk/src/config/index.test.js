/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import Config, {ConfigError} from './'

describe('Config', () => {
    test(`can instantiate new Config instance`, () => {
        expect(() => {
            new Config({})
        }).not.toThrow()
    })

    test(`validate - throw error when required property is missing`, () => {
        const config = new Config({})
        const expectedError = new ConfigError(" - should have required property 'app'")
        expect(() => {
            config.validate()
        }).toThrow(expectedError)
    })

    test(`validate - success`, () => {
        const config = new Config({app: {}})
        expect(() => {
            config.validate()
        }).not.toThrow()
    })

    test(`_beautifyPropertyPath - success`, () => {
        const config = new Config({app: {}})
        const result = config._beautifyPropertyPath('/a/b/c/')
        expect(result).toBe('a.b.c')
    })

    test(`_beautifyPropertyPath - delimiter`, () => {
        const config = new Config({app: {}})
        const result = config._beautifyPropertyPath('.a.b.c.', '.')
        expect(result).toBe('a.b.c')
    })

    test(`_beautifyPropertyPath - empty string`, () => {
        const config = new Config({app: {}})
        const result = config._beautifyPropertyPath('', '/')
        expect(result).toBe('')
    })
})
