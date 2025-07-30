/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ExpressPaymentManager, calculateExpressPaymentHeight} from './express-payment-manager'

// Mock window.parent.postMessage
const mockPostMessage = jest.fn()

// Setup global window mock before importing the module
Object.defineProperty(global, 'window', {
    value: {
        parent: {
            postMessage: mockPostMessage
        }
    },
    writable: true
})

describe('ExpressPaymentManager', () => {
    let manager

    beforeEach(() => {
        manager = new ExpressPaymentManager()
        mockPostMessage.mockClear()
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
            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should not initialize twice', () => {
            const paymentMethods = ['applepay']
            manager.initialize(paymentMethods)
            manager.initialize(paymentMethods)

            expect(manager.totalAttempted).toBe(1)
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
            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should not mark same payment method as available twice', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('applepay')

            expect(manager.availableCount).toBe(1)
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
            expect(mockPostMessage).not.toHaveBeenCalled()
        })

        it('should not mark same payment method as unavailable twice', () => {
            manager.setPaymentMethodUnavailable('applepay')
            manager.setPaymentMethodUnavailable('applepay')

            expect(mockPostMessage).not.toHaveBeenCalled()
        })
    })

    describe('checkIfDone and sendDoneMessage', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()
        })

        it('should send done message when all payment methods are processed', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: 'express.payment.done',
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

        it('should send done message with correct height for multiple available methods', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: 'express.payment.done',
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

        it('should send done message with zero height when no methods are available', () => {
            manager.setPaymentMethodUnavailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            expect(mockPostMessage).toHaveBeenCalledWith(
                {
                    type: 'express.payment.done',
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

        it('should only send done message once', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            // Try to trigger done again
            manager.setPaymentMethodAvailable('applepay')

            expect(mockPostMessage).toHaveBeenCalledTimes(1)
        })
    })

    describe('getState', () => {
        beforeEach(() => {
            manager.initialize(['applepay', 'googlepay'])
        })

        it('should return current state', () => {
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodUnavailable('googlepay')

            const state = manager.getState()

            expect(state).toEqual({
                paymentMethods: {
                    applepay: {status: 'available', available: true},
                    googlepay: {status: 'unavailable', available: false}
                },
                availableCount: 1,
                totalAttempted: 2,
                height: 40,
                isDone: true
            })
        })
    })

    describe('integration scenarios', () => {
        it('should handle multiple payment methods becoming available', () => {
            manager.initialize(['applepay', 'googlepay'])
            mockPostMessage.mockClear()

            manager.setPaymentMethodAvailable('applepay')
            expect(manager.availableCount).toBe(1)
            expect(manager.getState().height).toBe(40)

            manager.setPaymentMethodAvailable('googlepay')
            expect(manager.availableCount).toBe(2)
            expect(manager.getState().height).toBe(88)

            expect(mockPostMessage).toHaveBeenCalledTimes(1)
        })

        it('should handle payment methods becoming unavailable after being available', () => {
            manager.initialize(['applepay', 'googlepay'])
            manager.setPaymentMethodAvailable('applepay')
            manager.setPaymentMethodAvailable('googlepay')
            mockPostMessage.mockClear()

            manager.setPaymentMethodUnavailable('applepay')
            expect(manager.availableCount).toBe(1)
            expect(manager.getState().height).toBe(40)

            // Should not send another message since the manager is already done
            expect(mockPostMessage).toHaveBeenCalledTimes(0)
        })
    })
}) 