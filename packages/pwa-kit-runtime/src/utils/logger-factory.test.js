/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import createLogger, {PWAKitLogger} from './logger-factory'

describe('PWAKitLogger', () => {
    const levels = ['error', 'warn', 'info', 'debug']

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

    describe('logger with TEXT format', () => {})
})
