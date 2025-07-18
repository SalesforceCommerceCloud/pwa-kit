/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, act} from '@testing-library/react'
import {useAppOnlineStatus} from './use-app-online-status'

// Mock the watchOnlineStatus utility
jest.mock('../../../utils/utils', () => ({
    watchOnlineStatus: jest.fn()
}))

import {watchOnlineStatus} from '../../../utils/utils'

describe('useAppOnlineStatus', () => {
    let originalOnLine
    let addEventListenerSpy
    let removeEventListenerSpy
    let mockUnsubscribe

    beforeEach(() => {
        // Store original descriptor
        originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine')

        // Clear any existing property first
        delete navigator.onLine

        // Mock window event listeners
        addEventListenerSpy = jest.spyOn(window, 'addEventListener')
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

        // Create mock unsubscribe function
        mockUnsubscribe = jest.fn()

        // Mock watchOnlineStatus to return unsubscribe function
        watchOnlineStatus.mockImplementation((callback) => {
            // Store callback for manual triggering in tests
            watchOnlineStatus.mockCallback = callback
            return mockUnsubscribe
        })
    })

    afterEach(() => {
        addEventListenerSpy.mockRestore()
        removeEventListenerSpy.mockRestore()
        watchOnlineStatus.mockClear()

        // Restore original navigator.onLine
        delete navigator.onLine
        if (originalOnLine) {
            Object.defineProperty(navigator, 'onLine', originalOnLine)
        }
    })

    it('returns initial online status', () => {
        // Set navigator.onLine before rendering
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(true)
        expect(watchOnlineStatus).toHaveBeenCalledWith(expect.any(Function))
    })

    it('returns false when initially offline', () => {
        // Set navigator.onLine to false before rendering
        Object.defineProperty(navigator, 'onLine', {
            value: false,
            writable: true,
            configurable: true
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(false)
        expect(watchOnlineStatus).toHaveBeenCalledWith(expect.any(Function))
    })

    it('sets up event listeners for online/offline events', () => {
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        })

        renderHook(() => useAppOnlineStatus())

        expect(watchOnlineStatus).toHaveBeenCalledWith(expect.any(Function))
    })

    it('cleans up event listeners on unmount', () => {
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        })

        const {unmount} = renderHook(() => useAppOnlineStatus())

        unmount()

        expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('updates status when going online', () => {
        Object.defineProperty(navigator, 'onLine', {
            value: false,
            writable: true,
            configurable: true
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(false)

        // Simulate going online
        act(() => {
            watchOnlineStatus.mockCallback(true)
        })

        expect(result.current.isOnline).toBe(true)
    })

    it('updates status when going offline', () => {
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(true)

        // Simulate going offline
        act(() => {
            watchOnlineStatus.mockCallback(false)
        })

        expect(result.current.isOnline).toBe(false)
    })

    it('handles multiple online/offline transitions', () => {
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true
        })

        const {result} = renderHook(() => useAppOnlineStatus())

        // Initially online
        expect(result.current.isOnline).toBe(true)

        // Go offline
        act(() => {
            watchOnlineStatus.mockCallback(false)
        })
        expect(result.current.isOnline).toBe(false)

        // Go back online
        act(() => {
            watchOnlineStatus.mockCallback(true)
        })
        expect(result.current.isOnline).toBe(true)

        // Go offline again
        act(() => {
            watchOnlineStatus.mockCallback(false)
        })
        expect(result.current.isOnline).toBe(false)
    })

    it('handles missing navigator.onLine gracefully', () => {
        // Don't define navigator.onLine - it should default to true
        const {result} = renderHook(() => useAppOnlineStatus())

        // Should default to true when navigator.onLine is not available
        expect(result.current.isOnline).toBe(true)
        expect(watchOnlineStatus).toHaveBeenCalledWith(expect.any(Function))
    })
})
