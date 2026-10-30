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

// The UMD-loading hook is irrelevant to the branch test — stub it.
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
        // isConfigured→false short-circuits to null; the shim and the UMD mount should not render.
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

    test('?mode=agent-redirect in URL overrides inline config for the current tab', () => {
        const originalSearch = window.location.search
        window.history.replaceState({}, '', '/product/500400?mode=agent-redirect')
        try {
            renderWithProviders(
                <InlineAgentWidget config={{...BASE_CONFIG, mode: 'inline'}} />
            )
            expect(screen.getByTestId('inline-agent-redirect-shim')).toBeInTheDocument()
        } finally {
            window.history.replaceState({}, '', `/${originalSearch}`)
        }
    })

    test('?mode=inline in URL overrides agent-redirect config for the current tab', () => {
        const originalSearch = window.location.search
        window.history.replaceState({}, '', '/product/500400?mode=inline')
        try {
            renderWithProviders(
                <InlineAgentWidget config={{...BASE_CONFIG, mode: 'agent-redirect'}} />
            )
            expect(screen.queryByTestId('inline-agent-redirect-shim')).not.toBeInTheDocument()
        } finally {
            window.history.replaceState({}, '', `/${originalSearch}`)
        }
    })

    test('?mode=bogus is ignored and config.mode wins', () => {
        const originalSearch = window.location.search
        window.history.replaceState({}, '', '/product/500400?mode=bogus')
        try {
            renderWithProviders(
                <InlineAgentWidget config={{...BASE_CONFIG, mode: 'agent-redirect'}} />
            )
            expect(screen.getByTestId('inline-agent-redirect-shim')).toBeInTheDocument()
        } finally {
            window.history.replaceState({}, '', `/${originalSearch}`)
        }
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
