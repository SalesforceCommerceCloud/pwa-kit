/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import InlineAgentWidget from '@salesforce/retail-react-app/app/components/inline-agent-widget'

const config = {
    enabled: true,
    scrt2Url: 'https://example.com',
    orgId: 'org',
    esDeveloperName: 'agent',
    placeholder: 'Ask a question'
}
const cartContext = {currency: 'GBP', items: [{productId: 'p1', name: 'Shirt', quantity: 1}]}

beforeAll(() => {
    customElements.define('inline-agent-widget', class extends HTMLElement {})
})

test('cart attributes are seeded before append and edits preserve the element', async () => {
    const append = jest.spyOn(HTMLElement.prototype, 'appendChild')
    const snapshots = []
    const original = append.getMockImplementation()
    append.mockImplementation(function (child) {
        if (child.tagName === 'INLINE-AGENT-WIDGET') {
            snapshots.push([child.getAttribute('cart-context'), child.getAttribute('ui-text')])
        }
        return original.call(this, child)
    })
    const props = {
        config,
        cartContext,
        title: 'Cart help',
        description: 'Questions only',
        uiText: {inputLabel: 'Localized question', loaderError: 'Unavailable'},
        pdpQuestions: ['Delivery date', 'Return policy', 'Compare items']
    }
    const {container, rerender, unmount} = render(<InlineAgentWidget {...props} />, {
        wrapper: ({children}) => (
            <IntlProvider locale="en-GB" defaultLocale="en-GB">
                {children}
            </IntlProvider>
        )
    })
    await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
    const element = container.querySelector('inline-agent-widget')
    expect(snapshots).toEqual([[JSON.stringify(cartContext), JSON.stringify(props.uiText)]])
    expect(element).toHaveAttribute('cart-mode', '')
    expect(element).not.toHaveAttribute('persist-session')
    expect(element).toHaveAttribute('title', props.title)
    expect(element).toHaveAttribute('description', props.description)
    expect(element).toHaveAttribute('pdp-questions', JSON.stringify(props.pdpQuestions))
    expect(element).toHaveAttribute('placeholder', config.placeholder)
    const updated = {...cartContext, items: [{...cartContext.items[0], quantity: 2}]}
    rerender(
        <InlineAgentWidget
            {...props}
            cartContext={updated}
            title="Updated"
            description={undefined}
            uiText={{inputLabel: 'Updated question'}}
        />
    )
    expect(container.querySelector('inline-agent-widget')).toBe(element)
    expect(element).toHaveAttribute('cart-context', JSON.stringify(updated))
    expect(element).toHaveAttribute('title', 'Updated')
    expect(element).not.toHaveAttribute('description')
    expect(element).toHaveAttribute('ui-text', JSON.stringify({inputLabel: 'Updated question'}))
    rerender(<InlineAgentWidget {...props} uiText={undefined} />)
    expect(container.querySelector('inline-agent-widget')).toBe(element)
    expect(element).not.toHaveAttribute('ui-text')
    unmount()
    expect(element.isConnected).toBe(false)
    append.mockRestore()
})

test('PDP retains persistence and product attributes without cart mode', async () => {
    const {container} = render(
        <IntlProvider locale="en-GB" defaultLocale="en-GB">
            <InlineAgentWidget config={config} productName="Shirt" pdpQuestions={['Fit?']} />
        </IntlProvider>
    )
    await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
    const element = container.querySelector('inline-agent-widget')
    expect(element).toHaveAttribute('persist-session', '')
    expect(element).toHaveAttribute('product-name', 'Shirt')
    expect(element).not.toHaveAttribute('cart-mode')
    expect(element).not.toHaveAttribute('cart-context')
})
