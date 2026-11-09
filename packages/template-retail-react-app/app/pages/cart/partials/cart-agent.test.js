/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {renderWithReactIntl} from '@salesforce/retail-react-app/app/utils/test-utils'
import {render} from '@testing-library/react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import InlineAgentWidget from '@salesforce/retail-react-app/app/components/inline-agent-widget'
import {baskets} from '@salesforce/retail-react-app/app/pages/cart/cart.mock'
import CartAgent from '@salesforce/retail-react-app/app/pages/cart/partials/cart-agent'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({getConfig: jest.fn()}))
jest.mock('@salesforce/retail-react-app/app/components/inline-agent-widget', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="widget" />)
}))

const config = {
    enabled: true,
    cartEnabled: true,
    scrt2Url: 'https://example.com',
    orgId: 'org',
    esDeveloperName: 'agent'
}
const basket = baskets.baskets[0]
beforeEach(() => {
    InlineAgentWidget.mockClear()
    getConfig.mockClear()
    getConfig.mockReturnValue({app: {embeddedAgent: config}})
})

test.each([
    undefined,
    {...config, cartEnabled: undefined},
    {...config, cartEnabled: false},
    {...config, cartEnabled: 'false'},
    {...config, cartEnabled: 'true'},
    {...config, enabled: false},
    {...config, enabled: 'false'},
    {...config, scrt2Url: ''},
    {...config, orgId: ''},
    {...config, esDeveloperName: ''}
])('does not mount for disabled or incomplete config %j', (embeddedAgent) => {
    getConfig.mockReturnValue({app: {embeddedAgent}})
    renderWithReactIntl(<CartAgent basket={basket} />)
    expect(screen.queryByTestId('widget')).not.toBeInTheDocument()
})

test.each([
    undefined,
    {...basket, basketId: ''},
    {...basket, productItems: []},
    {...basket, temporaryBasket: true}
])('rejects unavailable/empty/temporary basket %#', (value) => {
    renderWithReactIntl(<CartAgent basket={value} />)
    expect(screen.queryByTestId('widget')).not.toBeInTheDocument()
})

test('forwards the original config, three localized prompts and only allowlisted context', () => {
    const item = {...basket.productItems[0], privateField: 'PRIVATE_SENTINEL'}
    const product = {
        name: 'Catalog shirt',
        variationValues: {color: 'red'},
        variationAttributes: [
            {
                id: 'color',
                name: 'Colour',
                privateField: 'PRIVATE_SENTINEL',
                values: [
                    {value: 'red', name: 'Red', privateField: 'PRIVATE_SENTINEL'},
                    {value: 'blue', name: 'Blue'}
                ]
            }
        ]
    }
    render(
        <IntlProvider
            locale="en-GB"
            defaultLocale="en-GB"
            messages={{
                'cart_agent.chip.delivery_date': 'Localized delivery',
                'cart_agent.chip.return_policy': 'Localized returns',
                'cart_agent.chip.compare_items': 'Localized compare',
                'cart_agent.input_label': 'Localized question',
                'cart_agent.loader_error': 'Localized unavailable',
                'cart_agent.retry_label': 'Localized retry'
            }}
        >
            <CartAgent
                basket={{...basket, productItems: [item]}}
                productsByItemId={{[item.itemId]: product}}
                customerId="PRIVATE_SENTINEL"
            />
        </IntlProvider>
    )
    expect(getConfig).toHaveBeenCalledTimes(1)
    const props = InlineAgentWidget.mock.calls[0][0]
    expect(props.config).toBe(config)
    expect(props.pdpQuestions).toEqual([
        'Localized delivery',
        'Localized returns',
        'Localized compare'
    ])
    expect(props.title).toBe('Need help before checkout?')
    expect(props.description).toBe('Ask about sizing, delivery, returns, or items in your cart.')
    expect(props.uiText).toEqual({
        inputLabel: 'Localized question',
        placeholder: 'Ask about your cart',
        sendLabel: 'Send question',
        suggestionsLabel: 'Suggested questions',
        thinkingLabel: 'Thinking',
        questionTooLongError: 'Use 1,500 characters or fewer for your question.',
        connectionError: 'Unable to reach the server. Please try again.',
        genericError: 'Something went wrong. Please try again.',
        loaderError: 'Localized unavailable',
        retryLabel: 'Localized retry'
    })
    expect(props.cartContext).toEqual({
        currency: 'GBP',
        items: [
            {
                productId: item.productId,
                name: product.name,
                quantity: item.quantity,
                variationAttributes: [{id: 'color', name: 'Colour', value: 'red', valueName: 'Red'}]
            }
        ]
    })
    expect(JSON.stringify(props.cartContext)).not.toContain('PRIVATE_SENTINEL')
    expect(JSON.stringify(props.cartContext)).not.toContain(basket.basketId)
    expect(JSON.stringify(props.cartContext)).not.toContain(basket.customerInfo.email)
})

test('keeps session for item edits but remounts on customer or basket identity changes', () => {
    const {rerender} = render(<CartAgent basket={basket} customerId="one" />, {
        wrapper: ({children}) => (
            <IntlProvider locale="en-GB" defaultLocale="en-GB">
                {children}
            </IntlProvider>
        )
    })
    const original = screen.getByTestId('widget')
    rerender(
        <CartAgent basket={{...basket, productItems: [basket.productItems[0]]}} customerId="one" />
    )
    expect(screen.getByTestId('widget')).toBe(original)
    rerender(<CartAgent basket={basket} customerId="two" />)
    const changed = screen.getByTestId('widget')
    expect(changed).not.toBe(original)
    rerender(<CartAgent basket={{...basket, basketId: 'other'}} customerId="two" />)
    expect(screen.getByTestId('widget')).not.toBe(changed)
})

test('keeps all three default prompts for a single product without variation data', () => {
    renderWithReactIntl(<CartAgent basket={{...basket, productItems: [basket.productItems[0]]}} />)
    const props = InlineAgentWidget.mock.calls[0][0]
    expect(props.pdpQuestions).toEqual(['Delivery date', 'Return policy', 'Compare items'])
    expect(props.cartContext.items).toHaveLength(1)
    expect(props.cartContext.items[0].variationAttributes).toEqual([])
    expect(props.cartContext.items[0].name).toBe(basket.productItems[0].productName)
})
