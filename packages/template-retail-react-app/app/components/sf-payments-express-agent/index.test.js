/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {
    EXPRESS_BUY_NOW,
    EXPRESS_PAY_NOW
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'

// Captured props from the mocked SFPaymentsExpressButtons.
let capturedProps = null

jest.mock('@salesforce/retail-react-app/app/components/sf-payments-express-buttons', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react')
    const MockSFPaymentsExpressButtons = (props) => {
        capturedProps = props
        return <div data-testid="sf-payments-express-buttons" />
    }
    return MockSFPaymentsExpressButtons
})

// Import AFTER mocking so the mock is in place.
import SFPaymentsExpressAgent from '@salesforce/retail-react-app/app/components/sf-payments-express-agent'

afterEach(() => {
    capturedProps = null
    jest.clearAllMocks()
})

const baseProps = {
    prepareBasket: jest.fn(async () => ({basketId: 'b1'})),
    paymentCurrency: 'USD',
    initialAmount: 42.5
}

describe('SFPaymentsExpressAgent', () => {
    test('renders SFPaymentsExpressButtons with forwarded props', () => {
        renderWithProviders(<SFPaymentsExpressAgent {...baseProps} />)

        expect(screen.getByTestId('sf-payments-express-agent')).toBeInTheDocument()
        expect(screen.getByTestId('sf-payments-express-buttons')).toBeInTheDocument()
        expect(capturedProps.usage).toBe(EXPRESS_PAY_NOW)
        expect(capturedProps.paymentCurrency).toBe('USD')
        expect(capturedProps.initialAmount).toBe(42.5)
        expect(capturedProps.expressButtonLayout).toBe('vertical')
        expect(capturedProps.prepareBasket).toBe(baseProps.prepareBasket)
    })

    test('overrides default usage when caller passes EXPRESS_BUY_NOW', () => {
        renderWithProviders(<SFPaymentsExpressAgent {...baseProps} usage={EXPRESS_BUY_NOW} />)
        expect(capturedProps.usage).toBe(EXPRESS_BUY_NOW)
    })

    test('forwards optional layout props', () => {
        renderWithProviders(
            <SFPaymentsExpressAgent
                {...baseProps}
                expressButtonLayout="horizontal"
                maximumButtonCount={2}
                paymentCountryCode="US"
            />
        )
        expect(capturedProps.expressButtonLayout).toBe('horizontal')
        expect(capturedProps.maximumButtonCount).toBe(2)
        expect(capturedProps.paymentCountryCode).toBe('US')
    })

    test('wires onComplete to the SDK onOrderApproved prop with order payload', () => {
        const onComplete = jest.fn()
        renderWithProviders(<SFPaymentsExpressAgent {...baseProps} onComplete={onComplete} />)

        expect(capturedProps.onOrderApproved).toBeDefined()

        const order = {orderNo: 'ORD-123'}
        capturedProps.onOrderApproved(order)

        expect(onComplete).toHaveBeenCalledTimes(1)
        expect(onComplete).toHaveBeenCalledWith(order)
    })

    test('wires onCancel to the SDK cancel hook', () => {
        const onCancel = jest.fn()
        renderWithProviders(<SFPaymentsExpressAgent {...baseProps} onCancel={onCancel} />)

        expect(capturedProps.onExpressPaymentCancel).toBeDefined()
        capturedProps.onExpressPaymentCancel()

        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('wires onError to the SDK error hook', () => {
        const onError = jest.fn()
        renderWithProviders(<SFPaymentsExpressAgent {...baseProps} onError={onError} />)

        expect(capturedProps.onExpressPaymentError).toBeDefined()
        capturedProps.onExpressPaymentError({basketRecovered: false})

        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledWith({basketRecovered: false})
    })

    test('forwards onPaymentMethodsRendered untouched', () => {
        const onPaymentMethodsRendered = jest.fn()
        renderWithProviders(
            <SFPaymentsExpressAgent
                {...baseProps}
                onPaymentMethodsRendered={onPaymentMethodsRendered}
            />
        )
        expect(capturedProps.onPaymentMethodsRendered).toBe(onPaymentMethodsRendered)
    })

    test('leaves callback slots undefined when the caller omits them', () => {
        renderWithProviders(<SFPaymentsExpressAgent {...baseProps} />)
        expect(capturedProps.onOrderApproved).toBeUndefined()
        expect(capturedProps.onExpressPaymentCancel).toBeUndefined()
        expect(capturedProps.onExpressPaymentError).toBeUndefined()
    })
})
