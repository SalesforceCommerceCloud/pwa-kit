/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    onPaymentsDetailsSuccess,
    onPaymentsSuccess
} from '@salesforce/retail-react-app/app/api/adyen/contexts/helper'

describe('onPaymentsSuccess', () => {
    it('when response is successful', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsResponse: {
                isSuccessful: true,
                merchantReference: 'test'
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        await onPaymentsSuccess(navigate)(state, component, props, responses)
        expect(navigate).toHaveBeenCalled()
    })

    it('when response is action', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsResponse: {
                isSuccessful: false,
                merchantReference: 'test',
                action: {
                    type: 'Authorised'
                }
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        await onPaymentsSuccess(navigate)(state, component, props, responses)
        expect(component.handleAction).toHaveBeenCalled()
    })

    it('when response action is voucher', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsResponse: {
                isSuccessful: false,
                merchantReference: 'test',
                action: {
                    type: 'voucher'
                }
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        await onPaymentsSuccess(navigate)(state, component, props, responses)
        expect(navigate).toHaveBeenCalled()
    })

    it('when response is not successful', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsResponse: {
                isSuccessful: false,
                merchantReference: 'test'
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        const result = await onPaymentsSuccess(navigate)(state, component, props, responses)
        expect(result instanceof Error).toBe(true)
    })
})

describe('onPaymentsDetailsSuccess', () => {
    it('when response is successful', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsDetailsResponse: {
                isSuccessful: true,
                merchantReference: 'test'
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        await onPaymentsDetailsSuccess(navigate)(state, component, props, responses)
        expect(navigate).toHaveBeenCalled()
    })

    it('when response is action', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsDetailsResponse: {
                isSuccessful: false,
                merchantReference: 'test',
                action: {
                    type: 'Authorised'
                }
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        await onPaymentsDetailsSuccess(navigate)(state, component, props, responses)
        expect(component.handleAction).toHaveBeenCalled()
    })

    it('when response is not successful', async () => {
        const state = {}
        const props = {}
        const navigate = jest.fn()
        const responses = {
            paymentsDetailsResponse: {
                isSuccessful: false,
                merchantReference: 'test'
            }
        }
        const component = {
            handleAction: jest.fn()
        }
        const result = await onPaymentsDetailsSuccess(navigate)(state, component, props, responses)
        expect(result instanceof Error).toBe(true)
    })
})
