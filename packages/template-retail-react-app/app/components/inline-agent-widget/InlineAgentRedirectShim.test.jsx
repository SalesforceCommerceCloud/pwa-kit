/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import InlineAgentRedirectShim from '@salesforce/retail-react-app/app/components/inline-agent-widget/InlineAgentRedirectShim'
import {handoffToShopperAgent} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

jest.mock('@salesforce/retail-react-app/app/utils/shopper-agent-handoff', () => ({
    handoffToShopperAgent: jest.fn()
}))

const PILLS = ['Is it fragrance-free?', 'What size should I pick?']

beforeEach(() => {
    jest.clearAllMocks()
})

describe('InlineAgentRedirectShim', () => {
    test('renders opener pills from pdpQuestions', () => {
        renderWithProviders(
            <InlineAgentRedirectShim
                pdpQuestions={PILLS}
                productName="Ultimune Serum"
                productId="500400"
            />
        )
        PILLS.forEach((q) => {
            expect(screen.getByRole('button', {name: q})).toBeInTheDocument()
        })
    })

    test('clicking a pill hands off the question + product context', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <InlineAgentRedirectShim
                pdpQuestions={PILLS}
                productName="Ultimune Serum"
                productId="500400"
            />
        )
        await user.click(screen.getByRole('button', {name: PILLS[0]}))

        expect(handoffToShopperAgent).toHaveBeenCalledTimes(1)
        const arg = handoffToShopperAgent.mock.calls[0][0]
        expect(arg.question).toBe(PILLS[0])
        expect(arg.productContext.productId).toBe('500400')
        expect(arg.productContext.productName).toBe('Ultimune Serum')
        expect(typeof arg.productContext.pdpUrl).toBe('string')
    })

    test('submitting the input hands off the typed question', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <InlineAgentRedirectShim productName="Ultimune Serum" productId="500400" />
        )
        const input = screen.getByPlaceholderText(/Ask me anything about Ultimune Serum/)
        await user.type(input, 'does it have retinol?')
        await user.click(screen.getByRole('button', {name: 'Ask'}))

        expect(handoffToShopperAgent).toHaveBeenCalledTimes(1)
        expect(handoffToShopperAgent.mock.calls[0][0].question).toBe('does it have retinol?')
    })

    test('submit button is disabled when input is empty', () => {
        renderWithProviders(<InlineAgentRedirectShim />)
        expect(screen.getByRole('button', {name: 'Ask'})).toBeDisabled()
    })

    test('clears input after submit', async () => {
        const user = userEvent.setup()
        renderWithProviders(<InlineAgentRedirectShim productName="X" productId="x1" />)
        const input = screen.getByPlaceholderText(/Ask me anything about X/)
        await user.type(input, 'why?')
        await user.click(screen.getByRole('button', {name: 'Ask'}))
        expect(input.value).toBe('')
    })

    test('whitespace-only submissions are ignored', async () => {
        const user = userEvent.setup()
        renderWithProviders(<InlineAgentRedirectShim productName="X" productId="x1" />)
        const input = screen.getByPlaceholderText(/Ask me anything about X/)
        await user.type(input, '   ')
        // Button stays disabled with just whitespace trimmed-non-empty check? It only disables on === '',
        // so a space-only entry will enable it. Guard the handoff:
        await user.click(screen.getByRole('button', {name: 'Ask'}))
        expect(handoffToShopperAgent).not.toHaveBeenCalled()
    })

    test('renders generic placeholder when productName is absent', () => {
        renderWithProviders(<InlineAgentRedirectShim />)
        expect(screen.getByPlaceholderText('Ask me anything')).toBeInTheDocument()
    })

    test('omits the pills row when there are no pdpQuestions', () => {
        renderWithProviders(<InlineAgentRedirectShim productName="X" productId="x1" />)
        expect(screen.queryByTestId('inline-agent-redirect-pills')).not.toBeInTheDocument()
    })
})
