/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import createLogger, {PWAKITLogger} from './logger'

describe('PWAKITLogger', () => {
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

    test('should log using the log method', () => {
        const logger = createLogger('test-package')
        logger.log('This is a log message')
        expect(console.log).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is a log message'})
        )
    })

    test('should log an info message', () => {
        const logger = createLogger('test-package')
        logger.info('This is an info message')
        expect(console.info).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is an info message'})
        )
    })

    test('should log a debug message', () => {
        const debugLogger = new PWAKITLogger('test-package', 'debug', 'JSON')
        debugLogger.debug('This is a debug message')
        expect(console.debug).toHaveBeenCalledWith(
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
        const customLogger = new PWAKITLogger('test-package', 'warn', 'JSON')
        customLogger.info('This message should not be logged')
        customLogger.warn('This is a warn message')
        customLogger.error('This is an error message')

        expect(console.info).not.toHaveBeenCalled()
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
        expect(console.info).toHaveBeenCalledWith(
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
        expect(console.info).toHaveBeenCalledWith(
            expect.objectContaining({
                namespace: 'test-package.testNamespace',
                message: 'This is an info message',
                additionalProperties: {key: 'value'}
            })
        )
    })

    test('should default to info log level if invalid log level is given', () => {
        const customLogger = new PWAKITLogger('test-package', 'invalid', 'JSON')
        expect(customLogger.logLevel).toBe('info')
    })

    test('should not log debug message if log level is info', () => {
        const infoLogger = new PWAKITLogger('test-package', 'info', 'JSON')
        infoLogger.debug('This debug message should not be logged')
        expect(console.debug).not.toHaveBeenCalled()
    })

    test('should not include additionalProperties if it is not provided', () => {
        const logger = createLogger('test-package')
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })
        expect(console.info).toHaveBeenCalledWith(
            expect.not.objectContaining({
                additionalProperties: expect.anything()
            })
        )
    })

    test('should log message using TEXT format', () => {
        const logger = new PWAKITLogger('test-package', 'info', 'TEXT')
        logger.info('This is an info message')
        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining('test-package INFO This is an info message')
        )
    })

    test('should format log message correctly in TEXT format without packageName', () => {
        const logger = new PWAKITLogger('', 'info', 'TEXT')
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })

        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining('testNamespace INFO This is an info message')
        )
    })

    test('should format log message correctly in TEXT format with additional properties', () => {
        const logger = new PWAKITLogger('test-package', 'info', 'TEXT')
        logger.info('This is an info message with additional properties', {
            additionalProperties: {key: 'value'}
        })

        expect(console.info).toHaveBeenCalledWith(
            expect.stringContaining(
                'test-package INFO This is an info message with additional properties {"key":"value"}'
            )
        )
    })

    test('should format log message correctly in JSON format', () => {
        const logger = new PWAKITLogger('test-package', 'info', 'JSON')
        const formattedMessage = logger.formatLogMessage('This is a test message', {
            level: 'info',
            namespace: 'testNamespace',
            additionalProperties: {key: 'value'}
        })

        expect(formattedMessage).toEqual({
            namespace: 'test-package.testNamespace',
            message: 'This is a test message',
            additionalProperties: {key: 'value'}
        })
    })

    test('should handle missing namespace gracefully in JSON format', () => {
        const logger = new PWAKITLogger('', 'info', 'JSON')
        const formattedMessage = logger.formatLogMessage('This is a test message', {
            level: 'info',
            additionalProperties: {key: 'value'}
        })

        expect(formattedMessage).toEqual({
            message: 'This is a test message',
            additionalProperties: {key: 'value'}
        })
    })

    test('should use default values in constructor', () => {
        const defaultLogger = new PWAKITLogger()
        defaultLogger.info('This is an info message with default values')
        expect(defaultLogger.logLevel).toBe('info')
        expect(defaultLogger.format).toBe('JSON')
        expect(console.info).toHaveBeenCalledWith(
            expect.objectContaining({message: 'This is an info message with default values'})
        )
    })
})
