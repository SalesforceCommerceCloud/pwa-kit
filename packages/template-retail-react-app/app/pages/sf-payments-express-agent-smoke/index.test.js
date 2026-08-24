/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/sf-payments-express-agent', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react')
    const MockAgent = () => <div data-testid="sf-payments-express-agent" />
    return MockAgent
})

import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import SFPaymentsExpressAgentSmoke from '@salesforce/retail-react-app/app/pages/sf-payments-express-agent-smoke'

afterEach(() => {
    jest.clearAllMocks()
})

const emptyDerived = {derivedData: {totalItems: 0}}

describe('SFPaymentsExpressAgentSmoke', () => {
    test('renders the wrapper when a basket exists', () => {
        useCurrentBasket.mockReturnValue({
            data: {basketId: 'b1', currency: 'USD', orderTotal: 10},
            ...emptyDerived
        })

        renderWithProviders(<SFPaymentsExpressAgentSmoke />)

        expect(screen.getByTestId('sf-payments-express-agent-smoke-page')).toBeInTheDocument()
        expect(screen.getByTestId('sf-payments-express-agent')).toBeInTheDocument()
        expect(screen.queryByTestId('no-basket')).not.toBeInTheDocument()
    })

    test('shows a no-basket message when the basket is empty', () => {
        useCurrentBasket.mockReturnValue({data: {}, ...emptyDerived})

        renderWithProviders(<SFPaymentsExpressAgentSmoke />)

        expect(screen.getByTestId('no-basket')).toBeInTheDocument()
        expect(screen.queryByTestId('sf-payments-express-agent')).not.toBeInTheDocument()
    })

    test('exposes a template name', () => {
        expect(SFPaymentsExpressAgentSmoke.getTemplateName()).toBe(
            'sf-payments-express-agent-smoke'
        )
    })
})
