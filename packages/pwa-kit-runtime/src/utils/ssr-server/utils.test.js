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

describe('Type checking utility functions', () => {
    describe('isString', () => {
        test('should return true for string values', () => {
            expect(utils.isString('hello')).toBe(true)
            expect(utils.isString('')).toBe(true)
            expect(utils.isString('123')).toBe(true)
        })

        test('should return false for non-string values', () => {
            expect(utils.isString(123)).toBe(false)
            expect(utils.isString(true)).toBe(false)
            expect(utils.isString(null)).toBe(false)
            expect(utils.isString(undefined)).toBe(false)
            expect(utils.isString([])).toBe(false)
            expect(utils.isString({})).toBe(false)
            expect(utils.isString(() => {})).toBe(false)
        })
    })

    describe('isArray', () => {
        test('should return true for array values', () => {
            expect(utils.isArray([])).toBe(true)
            expect(utils.isArray([1, 2, 3])).toBe(true)
            expect(utils.isArray(['a', 'b', 'c'])).toBe(true)
            expect(utils.isArray([{}, {}])).toBe(true)
        })

        test('should return false for non-array values', () => {
            expect(utils.isArray('hello')).toBe(false)
            expect(utils.isArray(123)).toBe(false)
            expect(utils.isArray(true)).toBe(false)
            expect(utils.isArray(null)).toBe(false)
            expect(utils.isArray(undefined)).toBe(false)
            expect(utils.isArray({})).toBe(false)
            expect(utils.isArray(() => {})).toBe(false)
        })
    })

    describe('isObject', () => {
        test('should return true for object values', () => {
            expect(utils.isObject({})).toBe(true)
            expect(utils.isObject({a: 1})).toBe(true)
            expect(utils.isObject({nested: {value: 2}})).toBe(true)
        })

        test('should return false for non-object values', () => {
            expect(utils.isObject('hello')).toBe(false)
            expect(utils.isObject(123)).toBe(false)
            expect(utils.isObject(true)).toBe(false)
            expect(utils.isObject(null)).toBe(false)
            expect(utils.isObject(undefined)).toBe(false)
            expect(utils.isObject([])).toBe(false)
            expect(utils.isObject(() => {})).toBe(false)
        })
    })

    describe('isIterable', () => {
        test('should return true for arrays and objects', () => {
            expect(utils.isIterable([])).toBe(true)
            expect(utils.isIterable([1, 2, 3])).toBe(true)
            expect(utils.isIterable({})).toBe(true)
            expect(utils.isIterable({a: 1})).toBe(true)
        })

        test('should return false for non-iterable values', () => {
            expect(utils.isIterable('hello')).toBe(false)
            expect(utils.isIterable(123)).toBe(false)
            expect(utils.isIterable(true)).toBe(false)
            expect(utils.isIterable(null)).toBe(false)
            expect(utils.isIterable(undefined)).toBe(false)
            expect(utils.isIterable(() => {})).toBe(false)
        })
    })

    describe('forEachIn', () => {
        test('should iterate over object properties', () => {
            const obj = {a: 1, b: 2, c: 3}
            const callback = jest.fn()

            utils.forEachIn(obj, callback)

            expect(callback).toHaveBeenCalledTimes(3)
            expect(callback).toHaveBeenCalledWith('a', 1)
            expect(callback).toHaveBeenCalledWith('b', 2)
            expect(callback).toHaveBeenCalledWith('c', 3)
        })

        test('should iterate over array indices', () => {
            const arr = ['x', 'y', 'z']
            const callback = jest.fn()

            utils.forEachIn(arr, callback)

            expect(callback).toHaveBeenCalledTimes(3)
            expect(callback).toHaveBeenCalledWith('0', 'x')
            expect(callback).toHaveBeenCalledWith('1', 'y')
            expect(callback).toHaveBeenCalledWith('2', 'z')
        })

        test('should handle empty objects and arrays', () => {
            const emptyObj = {}
            const emptyArr = []
            const callback = jest.fn()

            utils.forEachIn(emptyObj, callback)
            utils.forEachIn(emptyArr, callback)

            expect(callback).not.toHaveBeenCalled()
        })

        test('should handle nested objects', () => {
            const obj = {a: {b: 1}, c: {d: 2}}
            const callback = jest.fn()

            utils.forEachIn(obj, callback)

            expect(callback).toHaveBeenCalledTimes(2)
            expect(callback).toHaveBeenCalledWith('a', {b: 1})
            expect(callback).toHaveBeenCalledWith('c', {d: 2})
        })

        test('should handle arrays with mixed types', () => {
            const arr = [1, 'string', {obj: true}, null]
            const callback = jest.fn()

            utils.forEachIn(arr, callback)

            expect(callback).toHaveBeenCalledTimes(4)
            expect(callback).toHaveBeenCalledWith('0', 1)
            expect(callback).toHaveBeenCalledWith('1', 'string')
            expect(callback).toHaveBeenCalledWith('2', {obj: true})
            expect(callback).toHaveBeenCalledWith('3', null)
        })
    })
})
