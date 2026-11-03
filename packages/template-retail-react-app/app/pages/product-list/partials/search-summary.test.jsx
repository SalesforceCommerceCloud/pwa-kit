/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {IntlProvider} from 'react-intl'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import theme from '@salesforce/retail-react-app/app/theme'
import SearchSummary from '@salesforce/retail-react-app/app/pages/product-list/partials/search-summary'
const mockOpenAgent = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-agent', () => ({
    useShopperAgent: () => ({actions: {open: mockOpenAgent}})
}))
// These display-only checks need no shopper login or background Commerce API requests.
const renderSummary = (component) =>
    render(
        <IntlProvider locale="en-GB">
            <MultiSiteProvider buildUrl={(path) => path}>
                <MemoryRouter>
                    <ChakraProvider theme={theme}>{component}</ChakraProvider>
                </MemoryRouter>
            </MultiSiteProvider>
        </IntlProvider>
    )
const props = {
    config: {followUps: true, agentHandoff: true, title: 'Your AI shopping guide'},
    text: 'Three good options from your search.',
    query: 'shirt',
    total: 50,
    currency: 'GBP',
    contextId: 'test-context',
    picks: Array.from({length: 4}, (_, i) => ({id: String(i), name: `Shirt ${i}`, price: 20 + i})),
    suggestions: [
        {id: 'waterproof', question: 'Which matches are waterproof?'},
        {id: 'budget', question: 'What are my options under £30?'}
    ],
    onFollowUp: jest.fn()
}
afterEach(() => jest.clearAllMocks())
test('the overview offers three real product links and a full-agent action', () => {
    renderSummary(<SearchSummary {...props} />)
    expect(screen.getByTestId('ai-pick-0')).toHaveAttribute(
        'href',
        expect.stringContaining('/product/0')
    )
    expect(screen.getByTestId('ai-pick-2')).toBeInTheDocument()
    expect(screen.queryByTestId('ai-pick-3')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /Go full agent mode/}))
    expect(mockOpenAgent).toHaveBeenCalledTimes(1)
})
test('quick questions and a custom question use the follow-up callback', () => {
    renderSummary(<SearchSummary {...props} />)
    fireEvent.click(screen.getByRole('button', {name: 'Which matches are waterproof?'}))
    expect(props.onFollowUp).toHaveBeenCalledWith('Which matches are waterproof?')
    const input = screen.getByRole('textbox', {name: 'Ask a follow-up about these results'})
    fireEvent.change(input, {target: {value: 'Show me jackets instead'}})
    fireEvent.submit(input.closest('form'))
    expect(props.onFollowUp).toHaveBeenCalledWith('Show me jackets instead')
})
test('questions wait until the summary or current answer finishes', () => {
    renderSummary(<SearchSummary {...props} isStreaming />)
    expect(
        screen.queryByRole('button', {name: 'What are my options under £30?'})
    ).not.toBeInTheDocument()
    expect(
        screen.getByRole('textbox', {name: 'Ask a follow-up about these results'})
    ).toBeDisabled()
    expect(screen.getByRole('button', {name: /Go full agent mode/})).toBeDisabled()
})

test('per-site switches hide follow-up and agent controls while retaining the overview', () => {
    renderSummary(
        <SearchSummary
            {...props}
            config={{followUps: false, agentHandoff: false, title: 'Our recommendations'}}
        />
    )
    expect(screen.getByText('Our recommendations')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /Go full agent mode/})).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
        screen.queryByRole('button', {name: 'Which matches are waterproof?'})
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('ai-pick-0')).toBeInTheDocument()
})

test('renders Markdown in both the overview and follow-up answer', () => {
    renderSummary(
        <SearchSummary
            {...props}
            text={'**Featured** jackets\n\n- Waterproof\n- Lightweight'}
            followUps={[
                {
                    id: 'markdown-answer',
                    question: 'Which ones?',
                    text: '### Details\n\n1. **Jacket one**\n2. Jacket two'
                }
            ]}
        />
    )
    expect(screen.getByTestId('search-ai-overview-text').querySelector('strong')).toHaveTextContent(
        'Featured'
    )
    expect(screen.getByTestId('search-ai-overview-text').querySelectorAll('li')).toHaveLength(2)
    expect(screen.getByTestId('search-follow-up-answer').querySelector('strong')).toHaveTextContent(
        'Jacket one'
    )
    expect(screen.getByTestId('search-follow-up-answer').querySelector('ol')).toBeInTheDocument()
})

test('fresh suggestions appear after the latest response instead of above the conversation', () => {
    renderSummary(
        <SearchSummary
            {...props}
            followUps={[
                {id: 'one', question: 'Compare these', text: 'The first is lighter.'},
                {id: 'two', question: 'What about care?', text: 'Care is not specified.'}
            ]}
            suggestions={[{id: 'next', question: 'Which details should I check before buying?'}]}
        />
    )
    const conversation = screen.getByTestId('search-follow-up-conversation')
    const next = screen.getByRole('button', {name: 'Which details should I check before buying?'})
    expect(
        conversation.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    fireEvent.click(next)
    expect(props.onFollowUp).toHaveBeenCalledWith('Which details should I check before buying?')
})
