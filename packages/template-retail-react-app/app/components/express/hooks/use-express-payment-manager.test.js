/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {
    useExpressPaymentManager,
    useExpressPaymentHeight
} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-manager'
import {expressPaymentManager} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-manager'

// Mock the expressPaymentManager
jest.mock('../utils/express-payment-manager', () => ({
    expressPaymentManager: {
        initialize: jest.fn(),
        getCurrentHeight: jest.fn(),
        addHeightListener: jest.fn(),
        removeHeightListener: jest.fn()
    }
}))

describe('useExpressPaymentManager', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should initialize manager with valid payment method IDs', () => {
        const paymentMethodIds = ['googlepay', 'applepay']

        const {result} = renderHook(() => useExpressPaymentManager(paymentMethodIds))

        expect(expressPaymentManager.initialize).toHaveBeenCalledWith(paymentMethodIds)
        expect(result.current.manager).toBe(expressPaymentManager)
        expect(result.current.error).toBeNull()
    })

    it('should set error when no payment method IDs are provided', () => {
        const {result} = renderHook(() => useExpressPaymentManager([]))

        expect(expressPaymentManager.initialize).not.toHaveBeenCalled()
        expect(result.current.manager).toBe(expressPaymentManager)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error.message).toBe('No payment method IDs provided or invalid array')
    })

    it('should set error when payment method IDs is not an array', () => {
        const {result} = renderHook(() => useExpressPaymentManager('invalid'))

        expect(expressPaymentManager.initialize).not.toHaveBeenCalled()
        expect(result.current.manager).toBe(expressPaymentManager)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error.message).toBe('No payment method IDs provided or invalid array')
    })

    it('should set error when payment method IDs is null', () => {
        const {result} = renderHook(() => useExpressPaymentManager(null))

        expect(expressPaymentManager.initialize).not.toHaveBeenCalled()
        expect(result.current.manager).toBe(expressPaymentManager)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error.message).toBe('No payment method IDs provided or invalid array')
    })

    it('should set error when payment method IDs is undefined', () => {
        const {result} = renderHook(() => useExpressPaymentManager(undefined))

        expect(expressPaymentManager.initialize).not.toHaveBeenCalled()
        expect(result.current.manager).toBe(expressPaymentManager)
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error.message).toBe('No payment method IDs provided or invalid array')
    })

    it('should handle initialization errors', () => {
        const error = new Error('Initialization failed')
        expressPaymentManager.initialize.mockImplementation(() => {
            throw error
        })

        const paymentMethodIds = ['googlepay']
        const {result} = renderHook(() => useExpressPaymentManager(paymentMethodIds))

        expect(expressPaymentManager.initialize).toHaveBeenCalledWith(paymentMethodIds)
        expect(result.current.manager).toBe(expressPaymentManager)
        expect(result.current.error).toBe(error)

        // Reset the mock to prevent affecting other tests
        expressPaymentManager.initialize.mockReset()
    })

    it('should only initialize once on mount', () => {
        const paymentMethodIds = ['googlepay']

        const {rerender} = renderHook(() => useExpressPaymentManager(paymentMethodIds))

        // Re-render with same payment method IDs
        rerender()

        expect(expressPaymentManager.initialize).toHaveBeenCalledTimes(1)
        expect(expressPaymentManager.initialize).toHaveBeenCalledWith(paymentMethodIds)
    })
})

describe('useExpressPaymentHeight', () => {
    const mockHeight = 40
    const mockHeightListener = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        expressPaymentManager.getCurrentHeight.mockReturnValue(mockHeight)
        expressPaymentManager.addHeightListener.mockImplementation((listener) => {
            mockHeightListener.mockImplementation(listener)
        })
    })

    it('should return initial height from manager', () => {
        const {result} = renderHook(() => useExpressPaymentHeight())

        expect(expressPaymentManager.getCurrentHeight).toHaveBeenCalled()
        expect(expressPaymentManager.addHeightListener).toHaveBeenCalled()
        expect(result.current).toBe(mockHeight)
    })

    it('should update height when listener is called', () => {
        const {result} = renderHook(() => useExpressPaymentHeight())

        const newHeight = 88

        act(() => {
            // Simulate height change by calling the listener
            mockHeightListener(newHeight)
        })

        expect(result.current).toBe(newHeight)
    })

    it('should remove height listener on unmount', () => {
        const {unmount} = renderHook(() => useExpressPaymentHeight())

        unmount()

        expect(expressPaymentManager.removeHeightListener).toHaveBeenCalled()
    })

    it('should handle multiple height changes', () => {
        const {result} = renderHook(() => useExpressPaymentHeight())

        const heights = [0, 40, 88, 136]

        heights.forEach((height) => {
            act(() => {
                mockHeightListener(height)
            })
        })

        expect(result.current).toBe(136)
    })

    it('should maintain height state across re-renders', () => {
        const {result, rerender} = renderHook(() => useExpressPaymentHeight())

        const newHeight = 500

        act(() => {
            mockHeightListener(newHeight)
        })

        // Re-render the hook
        rerender()

        expect(result.current).toBe(newHeight)
    })

    it('should handle zero height', () => {
        expressPaymentManager.getCurrentHeight.mockReturnValue(0)

        const {result} = renderHook(() => useExpressPaymentHeight())

        expect(result.current).toBe(0)
    })
})

describe('Hook Integration', () => {
    it('should work together when both hooks are used', () => {
        const paymentMethodIds = ['googlepay', 'applepay']
        const mockHeight = 250

        expressPaymentManager.getCurrentHeight.mockReturnValue(mockHeight)

        const {result: managerResult} = renderHook(() => useExpressPaymentManager(paymentMethodIds))
        const {result: heightResult} = renderHook(() => useExpressPaymentHeight())

        expect(managerResult.current.manager).toBe(expressPaymentManager)
        expect(managerResult.current.error).toBeNull()
        expect(heightResult.current).toBe(mockHeight)
        expect(expressPaymentManager.initialize).toHaveBeenCalledWith(paymentMethodIds)
        expect(expressPaymentManager.getCurrentHeight).toHaveBeenCalled()
        expect(expressPaymentManager.addHeightListener).toHaveBeenCalled()
    })

    it('should handle manager errors without affecting height hook', () => {
        const error = new Error('Manager error')
        expressPaymentManager.initialize.mockImplementation(() => {
            throw error
        })

        const paymentMethodIds = ['googlepay']
        const mockHeight = 300

        expressPaymentManager.getCurrentHeight.mockReturnValue(mockHeight)

        const {result: managerResult} = renderHook(() => useExpressPaymentManager(paymentMethodIds))
        const {result: heightResult} = renderHook(() => useExpressPaymentHeight())

        expect(managerResult.current.error).toBe(error)
        expect(heightResult.current).toBe(mockHeight)

        // Reset the mock to prevent affecting other tests
        expressPaymentManager.initialize.mockReset()
    })
})
