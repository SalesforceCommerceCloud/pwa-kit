/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import createLogger, {PWAKitLogger} from './logger-factory'

describe('PWAKitLogger', () => {
    const levels = ['error', 'warn', 'info', 'debug']

    const _log = console.log
    _log(
        '--- NOTE: in this file, `console.log` is mocked. So use `_log` if you need access to the original method.'
    )

    beforeEach(() => {
        console.debug = jest.fn()
        console.log = jest.fn()
        console.info = jest.fn()
        console.warn = jest.fn()
        console.error = jest.fn()
        jest.resetModules()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    for (const level of levels) {
        test(`should log a ${level} message`, () => {
            const logger = createLogger({packageName: 'test-package'})
            logger[level](`This is a ${level} message`)
            expect(console[level]).toHaveBeenCalledWith(
                `test-package ${level.toUpperCase()} This is a ${level} message`
            )
        })
    }

    test('should use empty packageName if not provided', () => {
        const logger = new PWAKitLogger()
        logger.info('This is an info message with default packageName')
        expect(console.info).toHaveBeenCalledWith(
            ' INFO This is an info message with default packageName'
        )
    })

    test('should include additional properties in log message', () => {
        const logger = createLogger({packageName: 'test-package'})
        logger.info('This is an info message', {
            namespace: 'testNamespace',
            additionalProperties: {key: 'value'}
        })
        expect(console.info).toHaveBeenCalledWith(
            'test-package.testNamespace INFO This is an info message {"key":"value"}'
        )
    })

    test('should not include additionalProperties if it is not provided', () => {
        const logger = createLogger({packageName: 'test-package'})
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })
        expect(console.info).toHaveBeenCalledWith(
            'test-package.testNamespace INFO This is an info message'
        )
    })

    test('should log only namespace with an empty packageName', () => {
        const logger = new PWAKitLogger({packageName: ''})
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })
        expect(console.info).toHaveBeenCalledWith('testNamespace INFO This is an info message')
    })

    describe('serializeError method', () => {
        let logger

        beforeEach(() => {
            logger = createLogger({packageName: 'test-package'})
        })

        test('should serialize Error objects with name, message, and stack', () => {
            const error = new Error('Test error message')
            error.stack = 'Error: Test error message\n    at test.js:1:1'

            logger.info('Error occurred', {
                additionalProperties: {error}
            })

            const expectedErrorObj = {
                name: 'Error',
                message: 'Test error message',
                stack: 'Error: Test error message\n    at test.js:1:1'
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Error occurred {"error":${JSON.stringify(expectedErrorObj)}}`
            )
        })

        test('should serialize multiple Error objects in the same object', () => {
            const error1 = new Error('First error')
            error1.stack = 'Error: First error\n    at test1.js:1:1'

            const error2 = new Error('Second error')
            error2.stack = 'Error: Second error\n    at test2.js:1:1'

            logger.info('Multiple errors occurred', {
                additionalProperties: {
                    primaryError: error1,
                    secondaryError: error2,
                    message: 'Both errors occurred'
                }
            })

            const expectedError1 = {
                name: 'Error',
                message: 'First error',
                stack: 'Error: First error\n    at test1.js:1:1'
            }

            const expectedError2 = {
                name: 'Error',
                message: 'Second error',
                stack: 'Error: Second error\n    at test2.js:1:1'
            }

            const expectedObject = {
                primaryError: expectedError1,
                secondaryError: expectedError2,
                message: 'Both errors occurred'
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Multiple errors occurred ${JSON.stringify(expectedObject)}`
            )
        })

        test('should handle custom Error types', () => {
            class CustomError extends Error {
                constructor(message, code) {
                    super(message)
                    this.name = 'CustomError'
                    this.code = code
                }
            }

            const customError = new CustomError('Custom error message', 'ERR_CUSTOM')
            customError.stack = 'CustomError: Custom error message\n    at custom.js:1:1'

            logger.info('Custom error test', {
                additionalProperties: {error: customError}
            })

            const expectedError = {
                name: 'CustomError',
                message: 'Custom error message',
                stack: 'CustomError: Custom error message\n    at custom.js:1:1'
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Custom error test {"error":${JSON.stringify(expectedError)}}`
            )
        })

        test('should leave non-Error properties unchanged', () => {
            const error = new Error('Test error')
            error.stack = 'Error: Test error\n    at test.js:1:1'

            const plainObject = {
                message: 'Something went wrong',
                error: error,
                count: 5,
                isValid: true,
                data: {nested: 'object'},
                items: ['array', 'values']
            }

            logger.info('Object with error and other properties', {
                additionalProperties: plainObject
            })

            const expectedErrorObj = {
                name: 'Error',
                message: 'Test error',
                stack: 'Error: Test error\n    at test.js:1:1'
            }

            const expectedObject = {
                message: 'Something went wrong',
                error: expectedErrorObj,
                count: 5,
                isValid: true,
                data: {nested: 'object'},
                items: ['array', 'values']
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Object with error and other properties ${JSON.stringify(
                    expectedObject
                )}`
            )
        })

        test('should handle objects with no Error properties', () => {
            const plainObject = {
                message: 'No errors here',
                count: 42,
                isValid: true,
                data: {nested: 'object'}
            }

            logger.info('Plain object test', {
                additionalProperties: plainObject
            })

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Plain object test ${JSON.stringify(plainObject)}`
            )
        })

        test('should handle empty objects', () => {
            logger.info('Empty object test', {
                additionalProperties: {}
            })

            expect(console.info).toHaveBeenCalledWith('test-package INFO Empty object test {}')
        })

        test('should handle Error objects without stack property', () => {
            const error = new Error('Error without stack')
            delete error.stack

            logger.info('Error without stack', {
                additionalProperties: {error}
            })

            const expectedError = {
                name: 'Error',
                message: 'Error without stack',
                stack: undefined
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Error without stack {"error":${JSON.stringify(expectedError)}}`
            )
        })
    })

    describe('logger with TEXT format', () => {})
})
