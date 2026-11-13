/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {render, waitFor, cleanup, fireEvent, act} from '@testing-library/react'
import {
    DEFAULT_EMBEDDED_WIDGET_SOURCE_URL,
    resolveEmbeddedWidgetSourceUrl
} from '@salesforce/retail-react-app/app/utils/inline-agent-widget-utils'
import useInlineAgentWidget from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'
import loadWidget from '@salesforce/retail-react-app/app/utils/load-inline-agent-widget'

jest.mock('@salesforce/retail-react-app/app/utils/load-inline-agent-widget', () => ({
    __esModule: true,
    default: jest.fn()
}))

const baseConfig = {
    enabled: true,
    scrt2Url: 'https://scrt2.example',
    orgId: '00D123',
    esDeveloperName: 'storefront_agent'
}

const Mount = ({config}) => {
    const ref = useInlineAgentWidget(config, {
        productName: 'TrailFit',
        pdpQuestions: ['How does it fit?']
    })
    return (
        <>
            {config?.enabled && (
                <Helmet>
                    <script src={resolveEmbeddedWidgetSourceUrl(config)} async />
                </Helmet>
            )}
            <div ref={ref} />
        </>
    )
}

Mount.propTypes = {config: PropTypes.object}

describe('embedded widget pre-warm configuration', () => {
    beforeAll(() => {
        if (!customElements.get('inline-agent-widget')) {
            customElements.define('inline-agent-widget', class extends HTMLElement {})
        }
    })

    beforeEach(() => {
        jest.resetModules()
        loadWidget.mockImplementation(
            jest.requireActual('../utils/load-inline-agent-widget').default
        )
    })

    afterEach(cleanup)

    test.each([undefined, null])('does not load a script without configuration %s', (config) => {
        const {container} = render(<Mount config={config} />)
        expect(container.querySelector('inline-agent-widget')).toBeNull()
        expect(
            document.querySelector(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
        ).toBeNull()
    })

    test('ignores a download failure after the last consumer unmounts', async () => {
        const getSpy = jest.spyOn(customElements, 'get').mockReturnValue(undefined)
        const definedSpy = jest
            .spyOn(customElements, 'whenDefined')
            .mockReturnValue(new Promise(() => {}))
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        try {
            const consumer = render(<Mount config={baseConfig} />)
            const script = document.querySelector(
                `script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`
            )
            consumer.unmount()
            await act(async () => {
                fireEvent.error(script)
            })
            expect(errorSpy).not.toHaveBeenCalled()
            expect(script.isConnected).toBe(false)
        } finally {
            getSpy.mockRestore()
            definedSpy.mockRestore()
            errorSpy.mockRestore()
        }
    })

    test.each([false, true])(
        'renders late registration on existing mounts (early failure=%s)',
        async (earlyFailure) => {
            jest.useFakeTimers()
            const constructor = customElements.get('inline-agent-widget')
            const getSpy = jest.spyOn(customElements, 'get').mockReturnValue(undefined)
            let resolve
            const registration = new Promise((yes) => {
                resolve = yes
            })
            const definedSpy = jest
                .spyOn(customElements, 'whenDefined')
                .mockReturnValue(registration)
            const warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
            const script = document.createElement('script')
            script.src = DEFAULT_EMBEDDED_WIDGET_SOURCE_URL
            script.setAttribute('async', 'true')
            script.setAttribute('data-react-helmet', 'true')
            document.head.appendChild(script)
            if (earlyFailure) fireEvent.error(script)
            try {
                const first = render(<Mount config={baseConfig} />)
                const concurrent = render(<Mount config={baseConfig} />)
                const unmounted = render(<Mount config={baseConfig} />)
                unmounted.unmount()
                await act(async () => {
                    jest.advanceTimersByTime(10000)
                })
                expect(first.container.querySelector('inline-agent-widget')).toBeNull()
                await act(async () => {
                    getSpy.mockReturnValue(constructor)
                    resolve(constructor)
                })
                await act(async () => {
                    jest.advanceTimersByTime(20)
                })
                expect(first.container.querySelectorAll('inline-agent-widget')).toHaveLength(1)
                expect(warningSpy).toHaveBeenCalledTimes(1)
                expect(concurrent.container.querySelectorAll('inline-agent-widget')).toHaveLength(1)
                expect(unmounted.container.querySelector('inline-agent-widget')).toBeNull()
                expect(
                    document.querySelectorAll(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
                ).toHaveLength(1)
                expect(
                    document.querySelector(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
                ).toBe(script)
                expect(script.isConnected).toBe(true)
                expect(jest.getTimerCount()).toBe(0)
            } finally {
                cleanup()
                script.remove()
                getSpy.mockRestore()
                definedSpy.mockRestore()
                warningSpy.mockRestore()
                jest.useRealTimers()
            }
        }
    )

    test('retains error handling after final unmount and deferred Helmet cleanup', async () => {
        const constructor = customElements.get('inline-agent-widget')
        const getSpy = jest.spyOn(customElements, 'get').mockReturnValue(undefined)
        let resolve
        const registration = new Promise((yes) => {
            resolve = yes
        })
        const definedSpy = jest.spyOn(customElements, 'whenDefined').mockReturnValue(registration)
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        try {
            const first = render(<Mount config={baseConfig} />)
            const original = document.querySelector(
                `script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`
            )
            first.unmount()
            await act(async () => new Promise((done) => requestAnimationFrame(done)))
            expect(original.isConnected).toBe(false)
            const second = render(<Mount config={baseConfig} />)
            await act(async () => new Promise((done) => requestAnimationFrame(done)))
            const replacement = document.querySelector(
                `script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`
            )
            expect(replacement).toBe(original)
            await act(async () => {
                fireEvent.error(replacement)
            })
            expect(errorSpy).toHaveBeenCalledWith('Inline agent widget CDN script failed to load')
            expect(replacement.isConnected).toBe(false)
            second.unmount()
            const third = render(<Mount config={baseConfig} />)
            await act(async () => {
                getSpy.mockReturnValue(constructor)
                resolve(constructor)
            })
            expect(third.container.querySelectorAll('inline-agent-widget')).toHaveLength(1)
            expect(
                document.querySelectorAll(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
            ).toHaveLength(1)
        } finally {
            cleanup()
            getSpy.mockRestore()
            definedSpy.mockRestore()
            errorSpy.mockRestore()
        }
    })

    test('reuses an SSR script and retries a later load failure', async () => {
        const constructor = customElements.get('inline-agent-widget')
        const getSpy = jest.spyOn(customElements, 'get').mockReturnValue(undefined)
        let register
        const registration = new Promise((resolve) => {
            register = resolve
        })
        const definedSpy = jest.spyOn(customElements, 'whenDefined').mockReturnValue(registration)
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        try {
            const ssrScript = document.createElement('script')
            ssrScript.src = DEFAULT_EMBEDDED_WIDGET_SOURCE_URL
            ssrScript.setAttribute('async', 'true')
            ssrScript.setAttribute('data-react-helmet', 'true')
            document.head.appendChild(ssrScript)
            const first = render(<Mount config={baseConfig} />)
            const concurrent = render(<Mount config={baseConfig} />)
            expect(ssrScript.isConnected).toBe(true)
            expect(
                document.querySelectorAll(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
            ).toHaveLength(1)
            const failedScript = document.querySelector(
                `script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`
            )
            expect(failedScript).toBe(ssrScript)
            await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)))
            expect(
                document.querySelectorAll(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
            ).toHaveLength(1)
            expect(
                document.querySelector(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)
            ).toBe(failedScript)
            fireEvent.error(failedScript)
            await waitFor(() =>
                expect(errorSpy).toHaveBeenCalledWith(
                    'Inline agent widget CDN script failed to load'
                )
            )
            expect(first.container.querySelector('inline-agent-widget')).toBeNull()
            expect(failedScript.isConnected).toBe(false)
            first.unmount()
            concurrent.unmount()
            const second = render(<Mount config={baseConfig} />)
            await act(async () => {
                getSpy.mockReturnValue(constructor)
                register(constructor)
            })
            await waitFor(() =>
                expect(second.container.querySelector('inline-agent-widget')).not.toBeNull()
            )
            const retryScript = document.querySelector(
                `script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`
            )
            expect(retryScript).not.toBe(failedScript)
            expect(retryScript.async).toBe(true)
        } finally {
            getSpy.mockRestore()
            definedSpy.mockRestore()
            errorSpy.mockRestore()
            document.querySelector(`script[src="${DEFAULT_EMBEDDED_WIDGET_SOURCE_URL}"]`)?.remove()
        }
    })

    test.each([
        ['inline', undefined, true],
        ['inline', true, true],
        ['inline', false, false],
        ['shopper-agent', true, true]
    ])('preserves %s mode with preWarm=%s', async (mode, preWarm, expected) => {
        const {container, unmount} = render(<Mount config={{...baseConfig, mode, preWarm}} />)
        await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
        const widget = container.querySelector('inline-agent-widget')
        expect(widget.hasAttribute('pre-warm')).toBe(expected)
        expect(widget.getAttribute('mode')).toBe(mode)
        expect(widget.getAttribute('product-name')).toBe('TrailFit')
        expect(widget.getAttribute('capabilities-version')).toBe('66')
        unmount()
        expect(container.querySelector('inline-agent-widget')).toBeNull()
    })

    test('can turn pre-warm off when configuration changes', async () => {
        const {container, rerender} = render(<Mount config={{...baseConfig, preWarm: true}} />)
        await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
        expect(container.querySelector('inline-agent-widget').hasAttribute('pre-warm')).toBe(true)
        rerender(<Mount config={{...baseConfig, preWarm: false}} />)
        await waitFor(() =>
            expect(container.querySelector('inline-agent-widget').hasAttribute('pre-warm')).toBe(
                false
            )
        )
    })
})
