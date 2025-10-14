/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'

jest.mock('../ssr-config', () => {
    return {
        getConfig: () => {}
    }
})

describe.each([[true], [false]])('Utils remote/local tests (isRemote: %p)', (isRemote) => {
    let originalEnv
    const bundleId = 'test-bundle-id-12345'

    beforeEach(() => {
        originalEnv = process.env
        process.env = Object.assign({}, process.env)
        process.env.BUNDLE_ID = bundleId
        if (isRemote) {
            process.env.AWS_LAMBDA_FUNCTION_NAME = 'remote-test-name'
        }
    })

    afterEach(() => {
        process.env = originalEnv
        jest.restoreAllMocks()
    })

    test(`getBundleBaseUrl should return the correct URL`, () => {
        const expectedId = isRemote ? bundleId : 'development'
        const expected = `/mobify/bundle/${expectedId}/`
        expect(utils.getBundleBaseUrl()).toBe(expected)
    })

    describe.each([[true], [false]])('Quiet/loud tests', (quiet) => {
        let originalQuiet

        beforeEach(() => {
            originalQuiet = utils.isQuiet()
            utils.setQuiet(quiet)
        })

        afterEach(() => {
            utils.setQuiet(originalQuiet)
            jest.restoreAllMocks()
        })

        test(`localDevLog should log conditionally (quiet: ${quiet})`, () => {
            const log = jest.spyOn(console, 'log').mockImplementation(() => {})
            const msg = 'message'
            utils.localDevLog(msg)
            const expected = !isRemote && !quiet ? [[msg]] : []
            expect(log.mock.calls).toEqual(expected)
        })

        test(`infoLog should log conditionally (quiet: ${quiet})`, () => {
            const log = jest.spyOn(console, 'log').mockImplementation(() => {})
            const msg = 'message'
            utils.infoLog(msg)
            const expected = !quiet ? [[msg]] : []
            expect(log.mock.calls).toEqual(expected)
        })
    })
})

describe('catchAndLog', () => {
    test('error with no args', () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {})
        utils.catchAndLog()
        expect(error).toHaveBeenCalledWith(
            'pwa-kit-runtime.catchAndLog ERROR Uncaught exception:  {"stack":"(no error)"}'
        )
    })
    test('error with stack', () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {})
        const err = new Error('test error')
        utils.catchAndLog(err)
        expect(error).toHaveBeenCalledWith(expect.stringContaining('Uncaught exception'))
    })
    test('error with message only', () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {})
        const err = {message: 'just a message'}
        utils.catchAndLog(err)
        expect(error).toHaveBeenCalled()
    })
    test('error as string', () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {})
        utils.catchAndLog('string error')
        expect(error).toHaveBeenCalled()
    })
})
