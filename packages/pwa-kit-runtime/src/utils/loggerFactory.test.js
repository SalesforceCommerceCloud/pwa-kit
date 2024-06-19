/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import createLogger, {PWAKITLogger} from './loggerFactory'

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
        const logger = createLogger({packageName: 'test-package'})
        logger.log('This is a log message')
        expect(console.info).toHaveBeenCalledWith('test-package INFO This is a log message')
    })

    test('should log an info message', () => {
        const logger = createLogger({packageName: 'test-package'})
        logger.info('This is an info message')
        expect(console.info).toHaveBeenCalledWith('test-package INFO This is an info message')
    })

    test('should log a debug message', () => {
        const logger = createLogger({packageName: 'test-package'})
        logger.debug('This is a debug message')
        expect(console.debug).toHaveBeenCalledWith('test-package DEBUG This is a debug message')
    })

    test('should log a warn message', () => {
        const logger = createLogger({packageName: 'test-package'})
        logger.warn('This is a warn message')
        expect(console.warn).toHaveBeenCalledWith('test-package WARN This is a warn message')
    })

    test('should log an error message', () => {
        const logger = createLogger({packageName: 'test-package'})
        logger.error('This is an error message')
        expect(console.error).toHaveBeenCalledWith('test-package ERROR This is an error message')
    })

    test('should use empty packageName if not provided', () => {
        const logger = new PWAKITLogger()
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
        const logger = new PWAKITLogger({packageName: ''})
        logger.info('This is an info message', {
            namespace: 'testNamespace'
        })
        expect(console.info).toHaveBeenCalledWith('testNamespace INFO This is an info message')
    })

    describe('logger with TEXT format', () => {})
})
