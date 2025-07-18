/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
import {renderHook, act} from '@testing-library/react'
import {useAppOnlineStatus} from './use-app-online-status'

// Mock utils
jest.mock('../../../utils/utils', () => ({
    watchOnlineStatus: jest.fn()
}))

describe('useAppOnlineStatus', () => {
    let mockUnsubscribe

    beforeEach(() => {
        mockUnsubscribe = jest.fn()

        // Reset navigator.onLine to a known state
        delete window.navigator.onLine
        Object.defineProperty(window.navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true
        })

        // Mock watchOnlineStatus to return an unsubscribe function
        const {watchOnlineStatus} = require('../../../utils/utils')
        watchOnlineStatus.mockReturnValue(mockUnsubscribe)
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    test('returns initial online status', () => {
        Object.defineProperty(window.navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(true)
    })

    test('returns false when initially offline', () => {
        Object.defineProperty(window.navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(false)
    })

    test('sets up watchOnlineStatus subscription', () => {
        const {watchOnlineStatus} = require('../../../utils/utils')

        renderHook(() => useAppOnlineStatus())

        expect(watchOnlineStatus).toHaveBeenCalledWith(expect.any(Function))
    })

    test('cleans up subscription on unmount', () => {
        const {unmount} = renderHook(() => useAppOnlineStatus())

        unmount()

        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })

    test('updates status when watchOnlineStatus callback is triggered', () => {
        const {watchOnlineStatus} = require('../../../utils/utils')
        let onlineStatusCallback

        watchOnlineStatus.mockImplementation((callback) => {
            onlineStatusCallback = callback
            return mockUnsubscribe
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        // Simulate status change via callback
        act(() => {
            onlineStatusCallback(false)
        })

        expect(result.current.isOnline).toBe(false)

        // Simulate status change back to online
        act(() => {
            onlineStatusCallback(true)
        })

        expect(result.current.isOnline).toBe(true)
    })

    test('handles multiple online/offline transitions', () => {
        const {watchOnlineStatus} = require('../../../utils/utils')
        let onlineStatusCallback

        watchOnlineStatus.mockImplementation((callback) => {
            onlineStatusCallback = callback
            return mockUnsubscribe
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        // Start online
        expect(result.current.isOnline).toBe(true)

        // Go offline
        act(() => {
            onlineStatusCallback(false)
        })
        expect(result.current.isOnline).toBe(false)

        // Go back online
        act(() => {
            onlineStatusCallback(true)
        })
        expect(result.current.isOnline).toBe(true)
    })

    test('handles missing navigator.onLine gracefully', () => {
        delete window.navigator.onLine

        const {result} = renderHook(() => useAppOnlineStatus())

        // Should default to true when navigator.onLine is undefined
        expect(result.current.isOnline).toBe(true)
    })

    test('calls watchOnlineStatus with correct callback function', () => {
        const {watchOnlineStatus} = require('../../../utils/utils')

        renderHook(() => useAppOnlineStatus())

        expect(watchOnlineStatus).toHaveBeenCalledTimes(1)
        expect(watchOnlineStatus).toHaveBeenCalledWith(expect.any(Function))
    })
})
