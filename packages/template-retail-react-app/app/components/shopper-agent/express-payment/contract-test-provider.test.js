/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ContractTestProvider, {
    CONTRACT_TEST_ORDER_ID
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/contract-test-provider'

const context = {
    providerApiVersion: 1,
    mode: 'shopper-agent',
    surface: 'product',
    siteId: 'RefArchGlobal',
    locale: 'en-GB',
    currency: 'GBP',
    productId: 'sku-1',
    quantity: 2
}

const createLifecycle = () => ({
    available: jest.fn(),
    unavailable: jest.fn(),
    success: jest.fn(),
    failure: jest.fn(),
    cancel: jest.fn()
})

describe('ContractTestProvider', () => {
    test('reports initial availability and exposes the launch context', async () => {
        const lifecycle = createLifecycle()

        renderWithProviders(<ContractTestProvider context={context} lifecycle={lifecycle} />)

        expect(screen.getByText('Product: sku-1, quantity: 2')).toBeInTheDocument()
        await waitFor(() => expect(lifecycle.available).toHaveBeenCalledWith())
    })

    test('exercises retryable unavailable, failure, and cancellation states', async () => {
        const user = userEvent.setup()
        const lifecycle = createLifecycle()
        renderWithProviders(<ContractTestProvider context={context} lifecycle={lifecycle} />)

        await user.click(screen.getByRole('button', {name: 'Report unavailable'}))
        expect(lifecycle.unavailable).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', {name: 'Report failure'}))
        expect(lifecycle.failure).toHaveBeenCalledWith({shopperMessage: 'Contract-test failure'})

        await user.click(screen.getByRole('button', {name: 'Report cancellation'}))
        expect(lifecycle.cancel).toHaveBeenCalledWith({
            shopperMessage: 'Contract-test cancellation'
        })

        await user.click(screen.getByRole('button', {name: 'Report available'}))
        expect(lifecycle.available).toHaveBeenLastCalledWith()
        expect(screen.getByRole('status')).toHaveTextContent('Available')
    })

    test('reports a clearly fake success and makes the fixture terminal', async () => {
        const user = userEvent.setup()
        const lifecycle = createLifecycle()
        renderWithProviders(<ContractTestProvider context={context} lifecycle={lifecycle} />)

        await user.click(screen.getByRole('button', {name: 'Report simulated success'}))

        expect(lifecycle.success).toHaveBeenCalledWith({orderId: CONTRACT_TEST_ORDER_ID})
        expect(screen.getByRole('status')).toHaveTextContent(
            'Simulated success submitted; fixture controls are now disabled'
        )
        expect(screen.getByRole('button', {name: 'Report available'})).toBeDisabled()
    })
})
