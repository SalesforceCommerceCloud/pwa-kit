/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import InlineAgentWidget from '@salesforce/retail-react-app/app/components/inline-agent-widget'

jest.mock('@salesforce/retail-react-app/app/hooks/use-inline-agent-widget', () => {
    const React = require('react')
    return {
        __esModule: true,
        default: () => React.createRef(),
        isConfigured: (config) =>
            Boolean(config?.enabled && config?.scrt2Url && config?.orgId && config?.esDeveloperName)
    }
})

const BASE_CONFIG = {
    enabled: true,
    scrt2Url: 'https://scrt2.example',
    orgId: '00D123',
    esDeveloperName: 'storefront_agent'
}

describe('InlineAgentWidget', () => {
    test('renders nothing meaningful when config is not configured', () => {
        renderWithProviders(<InlineAgentWidget config={{enabled: false}} />)
        expect(screen.queryByTestId('inline-agent-redirect-shim')).not.toBeInTheDocument()
    })

    test('does not render the redirect shim in default (inline) mode', () => {
        renderWithProviders(<InlineAgentWidget config={BASE_CONFIG} />)
        expect(screen.queryByTestId('inline-agent-redirect-shim')).not.toBeInTheDocument()
    })

    test('renders the redirect shim when mode === "agent-redirect"', () => {
        renderWithProviders(
            <InlineAgentWidget
                config={{...BASE_CONFIG, mode: 'agent-redirect'}}
                pdpQuestions={['A?', 'B?']}
                productName="Serum"
                productId="500400"
            />
        )
        expect(screen.getByTestId('inline-agent-redirect-shim')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'A?'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'B?'})).toBeInTheDocument()
    })

    test('mode === "hybrid" falls back to the inline UMD (reserved — no shim yet)', () => {
        renderWithProviders(
            <InlineAgentWidget config={{...BASE_CONFIG, mode: 'hybrid'}} />
        )
        expect(screen.queryByTestId('inline-agent-redirect-shim')).not.toBeInTheDocument()
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
