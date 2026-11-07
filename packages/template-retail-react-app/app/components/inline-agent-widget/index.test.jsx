/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createRef as mockCreateRef} from 'react'
import {screen, act} from '@testing-library/react'
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
        handoffMock.mockReset()
    })

    test('renders nothing meaningful when config is not configured', () => {
        renderWithProviders(<InlineAgentWidget config={{enabled: false}} />)
        expect(screen.queryByTestId('inline-shopper-agent-shim')).not.toBeInTheDocument()
    })

    test('renders the UMD mount container in inline mode (default)', () => {
        const {container} = renderWithProviders(<InlineAgentWidget config={BASE_CONFIG} />)
        // The local React shim (removed in favor of the UMD shim) should NOT render.
        expect(screen.queryByTestId('inline-shopper-agent-shim')).not.toBeInTheDocument()
        // The hook mount container is a plain div (ref target); the UMD custom
        // element is mounted into it imperatively — not visible in enzyme.
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

        // The local React shim is gone — the UMD paints the pills now.
        expect(screen.queryByTestId('inline-shopper-agent-shim')).not.toBeInTheDocument()

        // Simulate the UMD firing its handoff event; the host should call
        // handoffToShopperAgent with productId/productName context.
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
