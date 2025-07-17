/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useAppOnlineStatus} from './use-app-online-status'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
})

describe('useAppOnlineStatus', () => {
    let addEventListenerSpy
    let removeEventListenerSpy

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock window event listeners
        addEventListenerSpy = jest.spyOn(window, 'addEventListener')
        removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

        // Reset navigator.onLine to true
        navigator.onLine = true
    })

    afterEach(() => {
        addEventListenerSpy.mockRestore()
        removeEventListenerSpy.mockRestore()
    })

    it('returns initial online status', () => {
        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(true)
    })

    it('returns false when initially offline', () => {
        navigator.onLine = false

        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(false)
    })

    it('sets up event listeners for online/offline events', () => {
        renderHook(() => useAppOnlineStatus())

        expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
        expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('cleans up event listeners on unmount', () => {
        const {unmount} = renderHook(() => useAppOnlineStatus())

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
        expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('updates status when going online', () => {
        navigator.onLine = false
        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(false)

        // Simulate going online
        act(() => {
            navigator.onLine = true
            window.dispatchEvent(new Event('online'))
        })

        expect(result.current.isOnline).toBe(true)
    })

    it('updates status when going offline', () => {
        navigator.onLine = true
        const {result} = renderHook(() => useAppOnlineStatus())

        expect(result.current.isOnline).toBe(true)

        // Simulate going offline
        act(() => {
            navigator.onLine = false
            window.dispatchEvent(new Event('offline'))
        })

        expect(result.current.isOnline).toBe(false)
    })

    it('handles multiple online/offline transitions', () => {
        const {result} = renderHook(() => useAppOnlineStatus())

        // Start online
        expect(result.current.isOnline).toBe(true)

        // Go offline
        act(() => {
            navigator.onLine = false
            window.dispatchEvent(new Event('offline'))
        })
        expect(result.current.isOnline).toBe(false)

        // Go online again
        act(() => {
            navigator.onLine = true
            window.dispatchEvent(new Event('online'))
        })
        expect(result.current.isOnline).toBe(true)

        // Go offline again
        act(() => {
            navigator.onLine = false
            window.dispatchEvent(new Event('offline'))
        })
        expect(result.current.isOnline).toBe(false)
    })

    it('handles missing navigator.onLine gracefully', () => {
        // Temporarily remove navigator.onLine
        const originalOnLine = navigator.onLine
        delete navigator.onLine

        const {result} = renderHook(() => useAppOnlineStatus())

        // Should default to true when navigator.onLine is not available
        expect(result.current.isOnline).toBe(true)

        // Restore original value
        navigator.onLine = originalOnLine
    })
})
