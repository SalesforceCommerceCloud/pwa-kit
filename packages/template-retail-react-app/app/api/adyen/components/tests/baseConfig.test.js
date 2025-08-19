/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    onSubmit,
    getAmount,
    baseConfig,
    onAdditionalDetails
} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'

jest.mock('@salesforce/retail-react-app/app/api/adyen/services/payments-details', () => {
    return {
        AdyenPaymentsDetailsService: jest.fn().mockImplementation(() => ({
            submitPaymentsDetails: jest.fn().mockResolvedValue({mockData: 'Mocked response'})
        }))
    }
})

jest.mock('@salesforce/retail-react-app/app/api/adyen/services/payments', () => {
    return {
        AdyenPaymentsService: jest.fn().mockImplementation(() => ({
            submitPayment: jest.fn().mockResolvedValue({mockData: 'Mocked response'})
        }))
    }
})

describe('baseConfig function', () => {
    const mockProps = {
        beforeSubmit: [],
        afterSubmit: [],
        beforeAdditionalDetails: [],
        afterAdditionalDetails: [],
        onError: () => {}
    }

    const mockCallback = jest.fn()

    beforeEach(() => {
        mockCallback.mockClear()
    })

    it('returns expected configuration object', () => {
        const config = baseConfig(mockProps)
        expect(config.amount).toBeDefined()
        expect(config.onSubmit).toBeDefined()
        expect(config.onAdditionalDetails).toBeDefined()
    })
})

describe('onSubmit function', () => {
    it('throws an error for invalid state', async () => {
        const state = {isValid: false, data: {}}
        const component = {} // mock component object
        const props = {token: 'mockToken', basket: {basketId: '123', customerId: '456'}}

        await expect(onSubmit(state, component, props)).rejects.toThrow('invalid state')
    })

    it('should call AdyenPaymentsService and return the payment response', async () => {
        const state = {data: {origin: 'https://adyen.com'}, isValid: true}
        const component = 'testComponent'
        const props = {
            token: 'testToken',
            customerId: 'testCustomerId',
            returnUrl: 'https://adyen.com'
        }

        const result = await onSubmit(state, component, props)
        expect(result).toEqual({paymentsResponse: {mockData: 'Mocked response'}})
    })
})

describe('getAmount function', () => {
    it('returns null if basket is not provided', () => {
        const props = {}
        expect(getAmount(props)).toBeNull()
    })

    it('returns correct amount object if basket is provided', () => {
        const props = {
            basket: {
                orderTotal: 100,
                currency: 'USD'
            }
        }
        const expectedAmount = {
            value: 10000,
            currency: 'USD'
        }
        expect(getAmount(props)).toEqual(expectedAmount)
    })

    it('returns null if basket has no orderTotal or currency', () => {
        const props = {
            basket: undefined
        }
        expect(getAmount(props)).toBeNull()
    })
})

describe('onAdditionalDetails function', () => {
    it('should call AdyenPaymentsDetailsService and return the payment details response', async () => {
        const state = {data: 'test data'}
        const component = 'testComponent'
        const props = {token: 'testToken', customerId: 'testCustomerId'}

        const result = await onAdditionalDetails(state, component, props)
        expect(result).toEqual({paymentsDetailsResponse: {mockData: 'Mocked response'}})
    })
})
