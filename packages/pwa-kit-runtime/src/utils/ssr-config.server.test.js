/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './ssr-config.server'

describe('Server "getConfig"', () => {
    const env = process.env

    beforeEach(() => {
        jest.resetModules()
        process.env = {...env}
    })

    afterEach(() => {
        process.env = env
    })

    test('throws when no config files are found running remotely', () => {
        expect(getConfig).toThrow()
    })

    test('throws when no config files are found running locally', () => {
        process.env.AWS_LAMBDA_FUNCTION_NAME = ''
        expect(getConfig).toThrow()
    })

    test('config is cached', () => {
        const mockConfig = {
            test: 'test'
        }
        const mockConfigSearch = jest.fn().mockReturnValue({
            config: mockConfig
        })
        jest.doMock('cosmiconfig', () => {
            const originalModule = jest.requireActual('cosmiconfig')

            return {
                ...originalModule,
                cosmiconfigSync: () => ({
                    search: mockConfigSearch
                })
            }
        })
        // Call getConfig multiple times
        expect(getConfig()).toBe(mockConfig)
        expect(getConfig()).toBe(mockConfig)

        expect(mockConfigSearch).toHaveBeenCalledTimes(1)
    })
})
