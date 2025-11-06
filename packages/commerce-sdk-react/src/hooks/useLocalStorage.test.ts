/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import useLocalStorage from './useLocalStorage'

/* eslint-disable @typescript-eslint/no-var-requires */
describe('useLocalStorage', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()
        // Note: localStorage is already mocked in setup-jest.js
    })

    describe('React version compatibility', () => {
        it('should use useSyncExternalStore when available (React 18+)', () => {
            // Temporarily mock useSyncExternalStore to verify it's being used
            const mockUseSyncExternalStore = jest.fn().mockReturnValue('mocked-value')
            const originalReact = require('react')

            // Mock React to include useSyncExternalStore
            jest.doMock('react', () => ({
                ...originalReact,
                useSyncExternalStore: mockUseSyncExternalStore
            }))

            // Re-import the hook to get the version with the mocked React
            jest.resetModules()
            const useLocalStorageWithMock = require('./useLocalStorage').default

            const testKey = 'test-key'
            renderHook(() => useLocalStorageWithMock(testKey))

            // Verify useSyncExternalStore was called
            expect(mockUseSyncExternalStore).toHaveBeenCalled()

            // Clean up
            jest.resetModules()
        })

        it('should fallback to useState/useEffect when useSyncExternalStore is not available (React 17)', () => {
            // Mock React without useSyncExternalStore
            const originalReact = require('react')
            const mockUseState = jest.fn().mockReturnValue(['test-value', jest.fn()])
            const mockUseEffect = jest.fn()
            const mockUseCallback = jest.fn().mockImplementation((fn) => fn)

            jest.doMock('react', () => ({
                ...originalReact,
                useState: mockUseState,
                useEffect: mockUseEffect,
                useCallback: mockUseCallback,
                // Explicitly exclude useSyncExternalStore
                useSyncExternalStore: undefined
            }))

            // Re-import the hook
            jest.resetModules()
            const useLocalStorageWithMock = require('./useLocalStorage').default

            const testKey = 'test-key'
            renderHook(() => useLocalStorageWithMock(testKey))

            // Verify fallback hooks were called
            expect(mockUseState).toHaveBeenCalled()
            expect(mockUseEffect).toHaveBeenCalled()

            // Clean up
            jest.resetModules()
        })
    })

    describe('initial value reading', () => {
        it('should return the value from localStorage on initial render', () => {
            const testKey = 'test-key'
            const testValue = 'test-value'
            localStorage.setItem(testKey, testValue)

            const {result} = renderHook(() => useLocalStorage(testKey))

            expect(result.current).toBe(testValue)
        })

        it('should return null when localStorage is empty for the key', () => {
            const testKey = 'non-existent-key'
            // Don't set any value, should return null

            const {result} = renderHook(() => useLocalStorage(testKey))

            expect(result.current).toBeNull()
        })
    })

    describe('storage event handling', () => {
        it('should update value when storage event occurs for the same key', () => {
            const testKey = 'test-key'
            const initialValue = 'initial-value'
            const updatedValue = 'updated-value'

            localStorage.setItem(testKey, initialValue)

            const {result} = renderHook(() => useLocalStorage(testKey))

            expect(result.current).toBe(initialValue)

            // Simulate storage change and fire storage event
            act(() => {
                localStorage.setItem(testKey, updatedValue)
                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: testKey,
                        newValue: updatedValue,
                        oldValue: initialValue
                    })
                )
            })

            expect(result.current).toBe(updatedValue)
        })

        it('should not update value when storage event occurs for a different key', () => {
            const testKey = 'test-key'
            const initialValue = 'initial-value'

            localStorage.setItem(testKey, initialValue)

            const {result} = renderHook(() => useLocalStorage(testKey))

            expect(result.current).toBe(initialValue)

            // Simulate storage change for a different key
            act(() => {
                localStorage.setItem('different-key', 'different-value')
                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: 'different-key',
                        newValue: 'different-value'
                    })
                )
            })

            // Value should remain unchanged
            expect(result.current).toBe(initialValue)
        })

        it('should handle storage event when value is deleted (null)', () => {
            const testKey = 'test-key'
            const initialValue = 'initial-value'

            localStorage.setItem(testKey, initialValue)

            const {result} = renderHook(() => useLocalStorage(testKey))

            expect(result.current).toBe(initialValue)

            // Simulate storage deletion
            act(() => {
                localStorage.removeItem(testKey)
                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: testKey,
                        newValue: null,
                        oldValue: initialValue
                    })
                )
            })

            expect(result.current).toBeNull()
        })
    })

    describe('key changes', () => {
        it('should update value when key prop changes', () => {
            const initialKey = 'key1'
            const anotherKey = 'key2'
            const value1 = 'value1'
            const value2 = 'value2'

            localStorage.setItem(initialKey, value1)
            localStorage.setItem(anotherKey, value2)

            const {result, rerender} = renderHook(({key}) => useLocalStorage(key), {
                initialProps: {key: initialKey}
            })

            expect(result.current).toBe(value1)

            // Change the key
            rerender({key: anotherKey})

            expect(result.current).toBe(value2)
        })
    })

    describe('cross-tab communication', () => {
        it('should update when another tab changes the same localStorage key', () => {
            const testKey = 'shared-key'
            const initialValue = 'initial'
            const newValue = 'updated-from-another-tab'

            localStorage.setItem(testKey, initialValue)

            const {result} = renderHook(() => useLocalStorage(testKey))

            expect(result.current).toBe(initialValue)

            // Simulate another tab changing the value
            act(() => {
                localStorage.setItem(testKey, newValue)
                // Dispatch storage event (this would normally come from another tab)
                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: testKey,
                        newValue: newValue,
                        oldValue: initialValue
                    })
                )
            })

            expect(result.current).toBe(newValue)
        })

        it('should handle concurrent updates to multiple keys', () => {
            const key1 = 'key1'
            const key2 = 'key2'
            const value1 = 'value1'
            const value2 = 'value2'

            localStorage.setItem(key1, 'initial1')
            localStorage.setItem(key2, 'initial2')

            const {result: result1} = renderHook(() => useLocalStorage(key1))
            const {result: result2} = renderHook(() => useLocalStorage(key2))

            expect(result1.current).toBe('initial1')
            expect(result2.current).toBe('initial2')

            // Update both keys
            act(() => {
                localStorage.setItem(key1, value1)
                localStorage.setItem(key2, value2)

                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: key1,
                        newValue: value1
                    })
                )

                window.dispatchEvent(
                    new StorageEvent('storage', {
                        key: key2,
                        newValue: value2
                    })
                )
            })

            expect(result1.current).toBe(value1)
            expect(result2.current).toBe(value2)
        })
    })
})
