/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger, {PWAKITLogger} from './logger'

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
        logger.info('This is an info message')
        expect(console.log).toHaveBeenCalledWith('[PWAKITLOG][INFO] - This is an info message')
    })

    test('should log a debug message', () => {
        const debugLogger = new PWAKITLogger('debug')
        debugLogger.debug('This is a debug message')
        expect(console.log).toHaveBeenCalledWith('[PWAKITLOG][DEBUG] - This is a debug message')
    })

    test('should not log debug message if log level is info', () => {
        const infoLogger = new PWAKITLogger('info')
        infoLogger.debug('This debug message should not be logged')
        expect(console.log).not.toHaveBeenCalled()
    })

    test('should log a warn message', () => {
        logger.warn('This is a warn message')
        expect(console.warn).toHaveBeenCalledWith('[PWAKITLOG][WARN] - This is a warn message')
    })

    test('should log an error message', () => {
        logger.error('This is an error message')
        expect(console.error).toHaveBeenCalledWith('[PWAKITLOG][ERROR] - This is an error message')
    })

    test('should respect log level setting', () => {
        const customLogger = new PWAKITLogger('warn')
        customLogger.info('This message should not be logged')
        customLogger.warn('This is a warn message')
        customLogger.error('This is an error message')

        expect(console.log).not.toHaveBeenCalled()
        expect(console.warn).toHaveBeenCalledWith('[PWAKITLOG][WARN] - This is a warn message')
        expect(console.error).toHaveBeenCalledWith('[PWAKITLOG][ERROR] - This is an error message')
    })

    test('should log with message details', () => {
        logger.info('This is an info message', 'Detail')
        expect(console.log).toHaveBeenCalledWith(
            '[PWAKITLOG][INFO][Detail] - This is an info message'
        )
    })

    test('should default to info log level if invalid log level is given', () => {
        const customLogger = new PWAKITLogger('invalid')
        expect(customLogger.logLevel).toBe('info')
    })
})
