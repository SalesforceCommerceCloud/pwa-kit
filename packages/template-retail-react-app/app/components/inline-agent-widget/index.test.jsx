/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, createRef as mockCreateRef} from 'react'
import {screen, act, fireEvent, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import InlineAgentWidget from '@salesforce/retail-react-app/app/components/inline-agent-widget'
import {handoffToShopperAgent as handoffMock} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

jest.mock('@salesforce/retail-react-app/app/hooks/use-inline-agent-widget', () => {
    return {
        __esModule: true,
        default: () => mockCreateRef(),
        isConfigured: (config) => {
            if (!config?.enabled) return false
            if (config?.mode === 'shopper-agent') return true
            return Boolean(config?.scrt2Url && config?.orgId && config?.esDeveloperName)
        }
    }
})

jest.mock('@salesforce/retail-react-app/app/utils/shopper-agent-handoff', () => ({
    __esModule: true,
    handoffToShopperAgent: jest.fn()
}))

const BASE_CONFIG = {
    enabled: true,
    scrt2Url: 'https://scrt2.example',
    orgId: '00D123',
    esDeveloperName: 'storefront_agent'
}

describe('InlineAgentWidget', () => {
    beforeEach(() => {
        handoffMock.mockReset().mockResolvedValue({seeded: true, provider: 'commerce-client'})
    })

    test('uses the configured CDN source in the page script', async () => {
        const source =
            'https://cdn.search.cimulate.ai/inline-agent-widget/0.1.1/inline-agent-widget.umd.js'
        renderWithProviders(
            <InlineAgentWidget config={{...BASE_CONFIG, embeddedWidgetSourceUrl: source}} />
        )
        await waitFor(() =>
            expect(document.head.querySelector(`script[src="${source}"]`)).not.toBeNull()
        )
        expect(
            document.head.querySelector(
                'link[rel="preconnect"][href="https://cdn.search.cimulate.ai"]'
            )
        ).not.toBeNull()
        expect(
            document.head.querySelector('script[src="/static/inline-agent-widget.umd.js"]')
        ).toBeNull()
    })

    test.each([undefined, null])(
        'renders nothing and ignores handoffs with config %s',
        (config) => {
            const {container} = renderWithProviders(<InlineAgentWidget config={config} />)
            act(() => {
                document.dispatchEvent(
                    new CustomEvent('inline-agent-widget:handoff', {
                        detail: {question: 'Hello?'}
                    })
                )
            })
            expect(container.querySelector('div')).toBeNull()
            expect(handoffMock).not.toHaveBeenCalled()
        }
    )

    test.each(['none', 'commerce-client', 'rejection'])(
        'preserves a failed question for %s',
        async (provider) => {
            if (provider === 'rejection') {
                handoffMock.mockRejectedValueOnce(new Error('unavailable'))
            } else {
                handoffMock.mockResolvedValueOnce({seeded: false, provider})
            }
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            renderWithProviders(
                <InlineAgentWidget
                    config={{...BASE_CONFIG, mode: 'shopper-agent'}}
                    productId="500400"
                />
            )
            await act(async () => {
                document.dispatchEvent(
                    new CustomEvent('inline-agent-widget:handoff', {
                        detail: {question: 'What colors are available?', source: 'input'}
                    })
                )
            })
            expect(screen.getByRole('alert')).toHaveTextContent('What colors are available?')
            fireEvent.click(screen.getByRole('button', {name: 'Try again'}))
            await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
            expect(handoffMock).toHaveBeenCalledTimes(2)
            expect(handoffMock.mock.calls[1][0]).toMatchObject({
                question: 'What colors are available?',
                productContext: {productId: '500400'}
            })
            errorSpy.mockRestore()
        }
    )

    test('keeps MIAW questions available to copy into the chat', async () => {
        handoffMock.mockResolvedValueOnce({seeded: false, provider: 'miaw'})
        renderWithProviders(<InlineAgentWidget config={{...BASE_CONFIG, mode: 'shopper-agent'}} />)
        await act(async () => {
            document.dispatchEvent(
                new CustomEvent('inline-agent-widget:handoff', {
                    detail: {question: 'What colors are available?', source: 'input'}
                })
            )
        })
        expect(screen.getByRole('alert')).toHaveTextContent('What colors are available?')
        expect(screen.getByRole('alert')).toHaveTextContent('Copy your question below')
        expect(screen.queryByRole('button', {name: 'Try again'})).not.toBeInTheDocument()
    })

    test('ignores a failed handoff after switching products', async () => {
        let finish
        handoffMock.mockReturnValueOnce(
            new Promise((resolve) => {
                finish = resolve
            })
        )
        const ProductSwitch = () => {
            const [productId, setProductId] = useState('old')
            return (
                <>
                    <button onClick={() => setProductId('new')}>Switch product</button>
                    <InlineAgentWidget
                        config={{...BASE_CONFIG, mode: 'shopper-agent'}}
                        productId={productId}
                    />
                </>
            )
        }
        renderWithProviders(<ProductSwitch />)
        act(() =>
            document.dispatchEvent(
                new CustomEvent('inline-agent-widget:handoff', {detail: {question: 'Old product?'}})
            )
        )
        fireEvent.click(screen.getByRole('button', {name: 'Switch product'}))
        await act(async () => finish({seeded: false, provider: 'none'}))
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    test('renders nothing meaningful when config is not configured', () => {
        renderWithProviders(<InlineAgentWidget config={{enabled: false}} />)
        expect(screen.queryByTestId('inline-shopper-agent-shim')).not.toBeInTheDocument()
    })

    test('renders the UMD mount container in inline mode (default)', () => {
        const {container} = renderWithProviders(<InlineAgentWidget config={BASE_CONFIG} />)
        expect(screen.queryByTestId('inline-shopper-agent-shim')).not.toBeInTheDocument()
        expect(container.querySelector('div')).toBeInTheDocument()
    })

    test('mode === "shopper-agent" wires a document-level handoff listener', () => {
        renderWithProviders(
            <InlineAgentWidget
                config={{...BASE_CONFIG, mode: 'shopper-agent'}}
                pdpQuestions={['A?', 'B?']}
                productName="Serum"
                productId="500400"
            />
        )

        expect(screen.queryByTestId('inline-shopper-agent-shim')).not.toBeInTheDocument()

        act(() => {
            document.dispatchEvent(
                new CustomEvent('inline-agent-widget:handoff', {
                    bubbles: true,
                    detail: {question: 'Is it waterproof?', source: 'pill'}
                })
            )
        })

        expect(handoffMock).toHaveBeenCalledTimes(1)
        const payload = handoffMock.mock.calls[0][0]
        expect(payload.question).toBe('Is it waterproof?')
        expect(payload.productContext.productId).toBe('500400')
        expect(payload.productContext.productName).toBe('Serum')
    })

    test('hands off every embedded interaction with the current PDP context', () => {
        renderWithProviders(
            <InlineAgentWidget
                config={{...BASE_CONFIG, mode: 'shopper-agent'}}
                productId="500400"
                productName="Serum"
            />
        )

        const questions = [
            'Is it waterproof?',
            'What sizes are available?',
            'Tell me about the fit'
        ]
        questions.forEach((question, index) => {
            act(() => {
                document.dispatchEvent(
                    new CustomEvent('inline-agent-widget:handoff', {
                        detail: {question, source: index === 2 ? 'input' : 'pill'}
                    })
                )
            })
        })

        expect(handoffMock).toHaveBeenCalledTimes(3)
        questions.forEach((question, index) => {
            expect(handoffMock).toHaveBeenNthCalledWith(index + 1, {
                question,
                signal: expect.any(AbortSignal),
                productContext: {
                    productId: '500400',
                    productName: 'Serum',
                    pdpUrl: window.location.href
                }
            })
        })
    })

    test('removes the handoff listener when the embedded widget unmounts', () => {
        const {unmount} = renderWithProviders(
            <InlineAgentWidget
                config={{...BASE_CONFIG, mode: 'shopper-agent'}}
                productId="500400"
            />
        )
        unmount()

        act(() => {
            document.dispatchEvent(
                new CustomEvent('inline-agent-widget:handoff', {
                    detail: {question: 'Is it waterproof?'}
                })
            )
        })

        expect(handoffMock).not.toHaveBeenCalled()
    })

    test('ignores handoff events with no question', () => {
        renderWithProviders(
            <InlineAgentWidget
                config={{...BASE_CONFIG, mode: 'shopper-agent'}}
                productId="500400"
            />
        )

        act(() => {
            document.dispatchEvent(new CustomEvent('inline-agent-widget:handoff', {detail: {}}))
        })

        expect(handoffMock).not.toHaveBeenCalled()
    })

    test('does not attach a handoff listener in inline mode', () => {
        renderWithProviders(<InlineAgentWidget config={BASE_CONFIG} productId="500400" />)

        act(() => {
            document.dispatchEvent(
                new CustomEvent('inline-agent-widget:handoff', {
                    detail: {question: 'Hi?'}
                })
            )
        })

        expect(handoffMock).not.toHaveBeenCalled()
    })

    test('mode === "hybrid" falls back to the inline UMD (no handoff listener)', () => {
        renderWithProviders(
            <InlineAgentWidget config={{...BASE_CONFIG, mode: 'hybrid'}} productId="500400" />
        )

        act(() => {
            document.dispatchEvent(
                new CustomEvent('inline-agent-widget:handoff', {
                    detail: {question: 'Hi?'}
                })
            )
        })

        expect(handoffMock).not.toHaveBeenCalled()
    })

    test('warns in the console when config.mode is an unknown value', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        try {
            renderWithProviders(<InlineAgentWidget config={{...BASE_CONFIG, mode: 'nope'}} />)
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unknown mode "nope"'))
        } finally {
            warnSpy.mockRestore()
        }
    })
})
