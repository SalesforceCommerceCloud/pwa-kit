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

    describe('serializeForLogging method', () => {
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

        test('should serialize Error objects with cause recursively', () => {
            const rootCause = new Error('Root cause')
            rootCause.stack = 'Error: Root cause\n    at root.js:1:1'

            const mainError = new Error('Main error')
            mainError.cause = rootCause
            mainError.stack = 'Error: Main error\n    at main.js:1:1'

            logger.info('Nested error occurred', {
                additionalProperties: {error: mainError}
            })

            const expectedRootCause = {
                name: 'Error',
                message: 'Root cause',
                stack: 'Error: Root cause\n    at root.js:1:1'
            }

            const expectedMainError = {
                name: 'Error',
                message: 'Main error',
                stack: 'Error: Main error\n    at main.js:1:1',
                ...expectedRootCause
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Nested error occurred {"error":${JSON.stringify(
                    expectedMainError
                )}}`
            )
        })

        test('should serialize plain objects with Error properties', () => {
            const error = new Error('Test error')
            error.stack = 'Error: Test error\n    at test.js:1:1'

            const plainObject = {
                message: 'Something went wrong',
                error: error,
                count: 5,
                isValid: true
            }

            logger.info('Object with error', {
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
                isValid: true
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Object with error ${JSON.stringify(expectedObject)}`
            )
        })

        test('should serialize arrays containing Error objects', () => {
            const error1 = new Error('First error')
            error1.stack = 'Error: First error\n    at test1.js:1:1'

            const error2 = new Error('Second error')
            error2.stack = 'Error: Second error\n    at test2.js:1:1'

            const arrayWithErrors = ['string item', error1, 42, error2, {key: 'value'}]

            logger.info('Array with errors', {
                additionalProperties: {errors: arrayWithErrors}
            })

            // Get the actual call
            const actualCall = console.info.mock.calls[0][0]

            // Build expected string with all the components that should be present
            const expectedString =
                'test-package INFO Array with errors {"errors":["string item",{"name":"Error","message":"First error","stack":"Error: First error\\n    at test1.js:1:1"},42,{"name":"Error","message":"Second error","stack":"Error: Second error\\n    at test2.js:1:1"},{"key":"value"}]}'

            expect(actualCall).toBe(expectedString)
        })

        test('should return primitive values as-is', () => {
            const primitives = [
                {value: 'string', expected: '"string"'},
                {value: 42, expected: '42'},
                {value: true, expected: 'true'},
                {value: false, expected: 'false'},
                {value: null, expected: 'null'}
            ]

            primitives.forEach(({value, expected}, index) => {
                logger.info(`Primitive test ${index}`, {
                    additionalProperties: {value}
                })

                expect(console.info).toHaveBeenCalledWith(
                    `test-package INFO Primitive test ${index} {"value":${expected}}`
                )
            })
        })

        test('should handle undefined values', () => {
            logger.info('Undefined test', {
                additionalProperties: {value: undefined}
            })

            // undefined values are omitted from JSON.stringify output
            expect(console.info).toHaveBeenCalledWith('test-package INFO Undefined test {}')
        })

        test('should handle Error objects without cause', () => {
            const simpleError = new Error('Simple error')
            simpleError.stack = 'Error: Simple error\n    at simple.js:1:1'
            // Explicitly ensure no cause property
            delete simpleError.cause

            logger.info('Simple error test', {
                additionalProperties: {error: simpleError}
            })

            const expectedError = {
                name: 'Error',
                message: 'Simple error',
                stack: 'Error: Simple error\n    at simple.js:1:1'
            }

            expect(console.info).toHaveBeenCalledWith(
                `test-package INFO Simple error test {"error":${JSON.stringify(expectedError)}}`
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

        test('should handle empty objects and arrays', () => {
            logger.info('Empty structures test', {
                additionalProperties: {
                    emptyObject: {},
                    emptyArray: []
                }
            })

            expect(console.info).toHaveBeenCalledWith(
                'test-package INFO Empty structures test {"emptyObject":{},"emptyArray":[]}'
            )
        })
    })

    describe('logger with TEXT format', () => {})
})
