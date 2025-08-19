/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    ExpressPaymentManager,
    calculateExpressPaymentHeight
} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-manager'
import {EXPRESS_MESSAGES} from '@salesforce/retail-react-app/app/components/express/utils/constants'

// Mock window.parent.postMessage
const mockPostMessage = jest.fn()

describe('ExpressPaymentManager', () => {
    let originalWindow
    let manager

    beforeAll(() => {
        originalWindow = global.window
        Object.defineProperty(global, 'window', {
            value: {
                parent: {
                    postMessage: mockPostMessage
                }
            },
            writable: true
        })
    })

    afterAll(() => {
        global.window = originalWindow
    })

    beforeEach(() => {
        manager = new ExpressPaymentManager()
        mockPostMessage.mockClear()
        jest.clearAllMocks()
    })

    describe('calculateExpressPaymentHeight', () => {
        it('should return 0 for 0 available payment methods', () => {
            expect(calculateExpressPaymentHeight(0)).toBe(0)
        })

        it('should return 40 for 1 available payment method', () => {
            expect(calculateExpressPaymentHeight(1)).toBe(40)
        })

        it('should return 88 for 2 available payment methods', () => {
            expect(calculateExpressPaymentHeight(2)).toBe(88)
        })

        it('should return 136 for 3 available payment methods', () => {
            expect(calculateExpressPaymentHeight(3)).toBe(136)
        })
    })

    describe('initialize', () => {
        it('should register payment methods without sending any messages', () => {
            const paymentMethods = ['applepay', 'googlepay']
            manager.initialize(paymentMethods)

            expect(manager.totalAttempted).toBe(2)
            expect(manager.isInitialized).toBe(true)
            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should not initialize twice', () => {
            const paymentMethods = ['applepay']
            manager.initialize(paymentMethods)
            manager.initialize(paymentMethods)

            expect(manager.totalAttempted).toBe(1)
        })

        it('should register payment methods as pending', () => {
            const paymentMethods = ['applepay', 'googlepay']
            manager.initialize(paymentMethods)

            const state = manager.getState()
            expect(state.paymentMethods).toEqual({
                applepay: 'pending',
                googlepay: 'pending'
            })
        })
    })

    describe('setPaymentMethodAvailable', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()
        })

        it('should mark payment method as available but not send message until done', () => {
            manager.setPaymentMethodAvailable('applepay')

            expect(manager.availableCount).toBe(1)
            expect(manager.getState().paymentMethods.applepay).toBe('available')
            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should not mark same payment method as available twice', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('applepay')

            expect(manager.availableCount).toBe(1)
        })

        it('should only mark pending payment methods as available', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            // Try to mark unavailable method as available
            manager.setPaymentMethodAvailable('googlepay')

            expect(manager.availableCount).toBe(1)
            expect(manager.getState().paymentMethods.googlepay).toBe('unavailable')
        })
    })

    describe('setPaymentMethodUnavailable', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()
        })

        it('should mark payment method as unavailable but not send message until done', () => {
            manager.setPaymentMethodUnavailable('applepay')

            expect(manager.availableCount).toBe(0)
            expect(manager.getState().paymentMethods.applepay).toBe('unavailable')
            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should not mark same payment method as unavailable twice', () => {
            manager.setPaymentMethodUnavailable('applepay')
            manager.setPaymentMethodUnavailable('applepay')

            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should only mark pending payment methods as unavailable', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            // Try to mark available method as unavailable
            manager.setPaymentMethodUnavailable('applepay')

            expect(manager.availableCount).toBe(1)
            expect(manager.getState().paymentMethods.applepay).toBe('available')
        })
    })

    describe('checkIfDone and sendDoneMessage', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()
        })

        it('should send PAYMENT_AVAILABLE message when we have all payment methods availability status', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: EXPRESS_MESSAGES.PAYMENT_AVAILABLE,
                    payload: {
                        height: 40,
                        availableCount: 1,
                        totalAttempted: 2,
                        availableMethods: ['applepay'],
                        unavailableMethods: ['googlepay'],
                        allMethods: ['applepay', 'googlepay']
                    }
                },
                '*'
            )
        })

        it('should send PAYMENT_UNAVAILABLE message when no payment methods are available', () => {
            manager.setPaymentMethodUnavailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: EXPRESS_MESSAGES.PAYMENT_UNAVAILABLE,
                    payload: {
                        height: 0,
                        availableCount: 0,
                        totalAttempted: 2,
                        availableMethods: [],
                        unavailableMethods: ['applepay', 'googlepay'],
                        allMethods: ['applepay', 'googlepay']
                    }
                },
                '*'
            )
        })

        it('should send PAYMENT_AVAILABLE message with correct height for multiple available methods', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: EXPRESS_MESSAGES.PAYMENT_AVAILABLE,
                    payload: {
                        height: 88,
                        availableCount: 2,
                        totalAttempted: 2,
                        availableMethods: ['applepay', 'googlepay'],
                        unavailableMethods: [],
                        allMethods: ['applepay', 'googlepay']
                    }
                },
                '*'
            )
        })

        it('should only send done message once', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            // Try to trigger done again
            manager.setPaymentMethodAvailable('applepay')

            expect(mockPostMessage).toHaveBeenCalledTimes(1)
        })

        it('should not send message if not all payment methods have reported', () => {
            manager.setPaymentMethodAvailable('applepay')
            // googlepay still pending

            expect(mockPostMessage).not.toHaveBeenCalled()
        })
    })

    describe('height listeners', () => {
        let mockListener

        beforeEach(() => {
            mockListener = jest.fn()
            manager.initialize(['applepay', 'googlepay'])
        })

        it('should add and remove height listeners', () => {
            manager.addHeightListener(mockListener)
            expect(manager.heightListeners.has(mockListener)).toBe(true)

            manager.removeHeightListener(mockListener)
            expect(manager.heightListeners.has(mockListener)).toBe(false)
        })

        it('should notify height listeners when payment methods are processed - 1/2 available', () => {
            manager.addHeightListener(mockListener)

            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockListener).toHaveBeenCalledWith(40)
        })

        it('should notify height listeners when payment methods are processed - 2/2 available', () => {
            manager.addHeightListener(mockListener)

            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('googlepay')

            expect(mockListener).toHaveBeenCalledWith(88)
        })

        it('should notify multiple height listeners', () => {
            const mockListener2 = jest.fn()
            manager.addHeightListener(mockListener)
            manager.addHeightListener(mockListener2)

            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockListener).toHaveBeenCalledWith(40)
            expect(mockListener2).toHaveBeenCalledWith(40)
        })

        it('should not notify removed listeners', () => {
            manager.addHeightListener(mockListener)
            manager.removeHeightListener(mockListener)

            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockListener).not.toHaveBeenCalled()
        })
    })

    describe('getCurrentHeight', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
        })

        it('should return 0 when no payment methods are available', () => {
            expect(manager.getCurrentHeight()).toBe(0)
        })

        it('should return 0 when payment methods are processed and all are unavailable', () => {
            manager.setPaymentMethodUnavailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(manager.getCurrentHeight()).toBe(0)
        })

        it('should return correct height when payment methods are available', () => {
            manager.setPaymentMethodAvailable('applepay')
            expect(manager.getCurrentHeight()).toBe(40)

            manager.setPaymentMethodAvailable('googlepay')
            expect(manager.getCurrentHeight()).toBe(88)
        })

        it('should return correct height when payment methods become unavailable', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('googlepay')
            expect(manager.getCurrentHeight()).toBe(88)

            // Available is a final state -- once a payment method is marked as available, it stays available
            manager.setPaymentMethodUnavailable('applepay')
            expect(manager.getCurrentHeight()).toBe(88)
        })
    })

    describe('getState', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
        })

        it('should return current state with correct structure', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            const state = manager.getState()

            expect(state).toEqual({
                paymentMethods: {
                    applepay: 'available',
                    googlepay: 'unavailable'
                },
                availableCount: 1,
                totalAttempted: 2,
                isInitialized: true,
                isDone: true
            })
        })

        it('should return initial state before any payment methods are processed', () => {
            const state = manager.getState()

            expect(state).toEqual({
                paymentMethods: {
                    applepay: 'pending',
                    googlepay: 'pending'
                },
                availableCount: 0,
                totalAttempted: 2,
                isInitialized: true,
                isDone: false
            })
        })
    })

    describe('registerPaymentMethod', () => {
        it('should register new payment methods', () => {
            manager.registerPaymentMethod('applepay')
            expect(manager.totalAttempted).toBe(1)
            expect(manager.getState().paymentMethods.applepay).toBe('pending')
        })

        it('should not register the same payment method twice', () => {
            manager.registerPaymentMethod('applepay')
            manager.registerPaymentMethod('applepay')
            expect(manager.totalAttempted).toBe(1)
        })
    })

    describe('integration scenarios', () => {
        it('should handle multiple payment methods becoming available', () => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()

            manager.setPaymentMethodAvailable('applepay')
            expect(manager.availableCount).toBe(1)
            expect(manager.getCurrentHeight()).toBe(40)

            manager.setPaymentMethodAvailable('googlepay')
            expect(manager.availableCount).toBe(2)
            expect(manager.getCurrentHeight()).toBe(88)

            expect(mockPostMessage).toHaveBeenCalledTimes(1)
            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: EXPRESS_MESSAGES.PAYMENT_AVAILABLE,
                    payload: expect.objectContaining({
                        height: 88,
                        availableCount: 2
                    })
                },
                '*'
            )
        })

        it('should handle all payment methods becoming unavailable', () => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()

            manager.setPaymentMethodUnavailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: EXPRESS_MESSAGES.PAYMENT_UNAVAILABLE,
                    payload: expect.objectContaining({
                        height: 0,
                        availableCount: 0
                    })
                },
                '*'
            )
        })

        it('should handle mixed availability scenarios', () => {
            manager.initialize(['applepay', 'googlepay', 'paypal'])
            mockPostMessage.mockClear()

            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')
            manager.setPaymentMethodAvailable('paypal')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: EXPRESS_MESSAGES.PAYMENT_AVAILABLE,
                    payload: expect.objectContaining({
                        height: 88,
                        availableCount: 2,
                        availableMethods: ['applepay', 'paypal'],
                        unavailableMethods: ['googlepay']
                    })
                },
                '*'
            )
        })
    })
})
