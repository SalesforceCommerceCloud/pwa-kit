/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useErrorHandler} from '@salesforce/retail-react-app/app/hooks/use-error-handler'

// Mock the logger
jest.mock('@salesforce/retail-react-app/app/utils/logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        error: jest.fn()
    }
}))

// Mock the toast hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: jest.fn(() => ({
        showToast: jest.fn()
    }))
}))

import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

describe('useErrorHandler', () => {
    let mockShowToast
    let handleError

    beforeEach(() => {
        jest.clearAllMocks()
        mockShowToast = jest.fn()
        useToast.mockReturnValue({showToast: mockShowToast})

        const {result} = renderHook(() => useErrorHandler())
        handleError = result.current
    })

    describe('default behavior', () => {
        test('should log warning and show toast by default', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            handleError(message, error)

            expect(logger.warn).toHaveBeenCalledWith(message, {
                namespace: 'useErrorHandler.handleError',
                additionalProperties: {
                    error: error,
                    showUserMessage: true,
                    throwError: false
                }
            })
            expect(mockShowToast).toHaveBeenCalledWith({
                title: message,
                status: 'error'
            })
        })
    })

    describe('logLevel option', () => {
        test('should use logger.error when logLevel is error', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            handleError(message, error, {logLevel: 'error'})

            expect(logger.error).toHaveBeenCalledWith(message, {
                namespace: 'useErrorHandler.handleError',
                additionalProperties: {
                    error: error,
                    showUserMessage: true,
                    throwError: false
                }
            })
            expect(logger.warn).not.toHaveBeenCalled()
        })

        test('should use logger.warn when logLevel is warn (default)', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            handleError(message, error, {logLevel: 'warn'})

            expect(logger.warn).toHaveBeenCalledWith(message, {
                namespace: 'useErrorHandler.handleError',
                additionalProperties: {
                    error: error,
                    showUserMessage: true,
                    throwError: false
                }
            })
            expect(logger.error).not.toHaveBeenCalled()
        })
    })

    describe('showUserMessage option', () => {
        test('should not show toast when showUserMessage is false', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            handleError(message, error, {showUserMessage: false})

            expect(mockShowToast).not.toHaveBeenCalled()
            expect(logger.warn).toHaveBeenCalled()
        })
    })

    describe('logToConsole option', () => {
        test('should not log when logToConsole is false', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            handleError(message, error, {logToConsole: false})

            expect(logger.warn).not.toHaveBeenCalled()
            expect(logger.error).not.toHaveBeenCalled()
            expect(mockShowToast).toHaveBeenCalled()
        })
    })

    describe('throwError option', () => {
        test('should throw error when throwError is true', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            expect(() => {
                handleError(message, error, {throwError: true})
            }).toThrow('Test error')

            expect(logger.warn).toHaveBeenCalled()
            expect(mockShowToast).toHaveBeenCalled()
        })
    })

    describe('all options combined', () => {
        test('should handle all options correctly', () => {
            const error = new Error('Test error')
            const message = 'Test message'

            expect(() => {
                handleError(message, error, {
                    showUserMessage: false,
                    logToConsole: false,
                    throwError: true,
                    logLevel: 'error'
                })
            }).toThrow('Test error')

            expect(logger.error).not.toHaveBeenCalled()
            expect(logger.warn).not.toHaveBeenCalled()
            expect(mockShowToast).not.toHaveBeenCalled()
        })
    })
})
