/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, fireEvent, screen, waitFor} from '@testing-library/react'
import * as ReactIntl from 'react-intl'
import {
    renderWithProviders,
    renderWithReactIntl as render
} from '@salesforce/retail-react-app/app/utils/test-utils'

let InlineAgentWidget

const config = {
    enabled: true,
    scrt2Url: 'https://example.com',
    orgId: 'org',
    esDeveloperName: 'agent'
}
const Widget = ({enabled = true}) => {
    return <InlineAgentWidget config={enabled ? config : null} />
}
Widget.propTypes = {enabled: jest.requireActual('prop-types').bool}

let registered
beforeEach(() => {
    registered = false
    jest.spyOn(customElements, 'get').mockImplementation(() =>
        registered ? HTMLElement : undefined
    )
    jest.spyOn(customElements, 'whenDefined').mockImplementation(() => new Promise(() => {}))
    jest.isolateModules(() => {
        jest.doMock('react', () => React)
        jest.doMock('react-intl', () => ReactIntl)
        InlineAgentWidget = jest.requireActual(
            '@salesforce/retail-react-app/app/components/inline-agent-widget'
        ).default
    })
    jest.dontMock('react')
    jest.dontMock('react-intl')
})
afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
    document
        .querySelectorAll('script[src="/static/inline-agent-widget.umd.js"]')
        .forEach((script) => script.remove())
    delete window.InlineAgentWidget
})

test('errors and timeout expose Retry on the same page with unchanged config', async () => {
    jest.useFakeTimers()
    const {container, unmount} = render(
        <InlineAgentWidget
            config={config}
            uiText={{loaderError: 'Localized unavailable', retryLabel: 'Try again'}}
        />
    )
    for (const failure of ['error', 'load', 'timeout', 'registration']) {
        const script = document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')
        const removeListener = jest.spyOn(script, 'removeEventListener')
        if (failure === 'registration') {
            window.InlineAgentWidget = {
                defineElement: () => {
                    throw new Error('registration failed')
                }
            }
        }
        await act(async () => {
            if (failure === 'error' || failure === 'registration')
                script.dispatchEvent(new Event(failure === 'error' ? 'error' : 'load'))
            else {
                if (failure === 'load') script.dispatchEvent(new Event('load'))
                jest.advanceTimersByTime(15000)
            }
        })
        expect(screen.getByRole('alert')).toHaveTextContent('Localized unavailable')
        expect(removeListener).toHaveBeenCalledWith('load', expect.any(Function))
        expect(removeListener).toHaveBeenCalledWith('error', expect.any(Function))
        expect(script.isConnected).toBe(false)
        delete window.InlineAgentWidget
        fireEvent.click(screen.getByRole('button', {name: 'Try again'}))
        expect(document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')).not.toBe(
            script
        )
    }
    const retry = document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')
    registered = true
    await act(async () => retry.dispatchEvent(new Event('load')))
    expect(container.querySelector('inline-agent-widget')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    unmount()
})

test('unconfigured wrapper does not request a script', () => {
    render(<Widget enabled={false} />)
    expect(document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')).toBeNull()
})

test('disconnected waiters do not append', async () => {
    const {container, unmount} = render(<Widget />)
    const script = document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')
    unmount()
    registered = true
    await act(async () => script.dispatchEvent(new Event('load')))
    expect(container.querySelector('inline-agent-widget')).toBeNull()
    const next = render(<Widget />)
    await waitFor(() => expect(next.container.querySelector('inline-agent-widget')).not.toBeNull())
})

test('late registration recovers via Retry without configuration changes', async () => {
    const {container} = render(<InlineAgentWidget config={config} />)
    const script = document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')
    await act(async () => script.dispatchEvent(new Event('error')))
    expect(screen.getByRole('alert')).toHaveTextContent(
        'Assistant is unavailable. Please try again.'
    )
    registered = true
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}))
    await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
    expect(document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')).toBeNull()
})

test('PDP loader failure localizes fallback alert and Retry without cart uiText', async () => {
    renderWithProviders(<InlineAgentWidget config={config} productName="Shirt" />, {
        wrapperProps: {
            messages: {
                'inline_agent_widget.loader_error': 'Localized assistant unavailable',
                'inline_agent_widget.retry_label': 'Localized retry'
            }
        }
    })
    const script = document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')
    await act(async () => script.dispatchEvent(new Event('error')))
    expect(screen.getByRole('alert')).toHaveTextContent('Localized assistant unavailable')
    fireEvent.click(screen.getByRole('button', {name: 'Localized retry'}))
    expect(document.querySelector('script[src="/static/inline-agent-widget.umd.js"]')).not.toBe(
        script
    )
    registered = true
    await act(async () =>
        document
            .querySelector('script[src="/static/inline-agent-widget.umd.js"]')
            .dispatchEvent(new Event('load'))
    )
})
