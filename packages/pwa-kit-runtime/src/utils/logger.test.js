/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import createLogger, {PWAKITLogger} from './logger'

describe('PWAKITLogger', () => {
    beforeEach(() => {
        console.log = jest.fn()
        console.warn = jest.fn()
        console.error = jest.fn()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('should log an info message', () => {
        const logger = createLogger('test-package')
        logger.info('This is an info message')
        expect(console.log).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is an info message'})
        )
    })

    test('should log a debug message', () => {
        const debugLogger = new PWAKITLogger('debug', 'JSON', 'test-package')
        debugLogger.debug('This is a debug message')
        expect(console.log).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is a debug message'})
        )
    })

    test('should log a warn message', () => {
        const logger = createLogger('test-package')
        logger.warn('This is a warn message')
        expect(console.warn).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is a warn message'})
        )
    })

    test('should log an error message', () => {
        const logger = createLogger('test-package')
        logger.error('This is an error message')
        expect(console.error).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is an error message'})
        )
    })

    test('should respect log level setting', () => {
        const customLogger = new PWAKITLogger('warn', 'JSON', 'test-package')
        customLogger.info('This message should not be logged')
        customLogger.warn('This is a warn message')
        customLogger.error('This is an error message')

        expect(console.log).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is a warn message'})
        )
        expect(console.error).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is an error message'})
        )
    })

    test('should log with additional details', () => {
        const logger = createLogger('test-package')
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })
        expect(console.log).toHaveBeenCalledWith(
            expect.objectContaining({
                namespace: 'test-package.testNamespace',
                message: 'This is an info message'
            })
        )
    })

    test('should include additional properties in log message', () => {
        const logger = createLogger('test-package')
        logger.info('This is an info message', {
            namespace: 'testNamespace',
            additionalProperties: {key: 'value'}
        })
        expect(console.log).toHaveBeenCalledWith(
            expect.objectContaining({
                namespace: 'test-package.testNamespace',
                message: 'This is an info message',
                additionalProperties: {key: 'value'}
            })
        )
    })

    test('should default to info log level if invalid log level is given', () => {
        const customLogger = new PWAKITLogger('invalid', 'JSON', 'test-package')
        expect(customLogger.logLevel).toBe('info')
    })

    test('should not log debug message if log level is info', () => {
        const infoLogger = new PWAKITLogger('info', 'JSON', 'test-package')
        infoLogger.debug('This debug message should not be logged')
        expect(console.log).not.toHaveBeenCalled()
    })

    test('should not include additionalProperties if it is not provided', () => {
        const logger = createLogger('test-package')
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })
        expect(console.log).toHaveBeenCalledWith(
            expect.not.objectContaining({
                additionalProperties: expect.anything()
            })
        )
    })

    test('should not log message if the level is below the logger level', () => {
        const customLogger = new PWAKITLogger('warn', 'JSON', 'test-package')
        customLogger.info('This info message should not be logged')
        customLogger.debug('This debug message should not be logged')
        expect(console.log).not.toHaveBeenCalled()
        expect(console.warn).not.toHaveBeenCalled()
        expect(console.error).not.toHaveBeenCalled()
    })
})
