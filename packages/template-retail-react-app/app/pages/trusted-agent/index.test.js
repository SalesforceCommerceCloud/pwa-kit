/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import TrustedAgent from '@salesforce/retail-react-app/app/pages/trusted-agent/index'

// The page is a thin UI over the useTrustedAgent hook. We mock the hook so the
// test drives the page behaviour (wiring the input to login, surfacing errors,
// rendering agent state) without standing up the popup + Account Manager flow,
// which only completes against a real environment.
const mockLogin = jest.fn()
const mockLogout = jest.fn()
let mockTrustedAgentState

jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useTrustedAgent: () => ({
            ...mockTrustedAgentState,
            login: mockLogin,
            logout: mockLogout
        })
    }
})

describe('Trusted Agent page', () => {
    beforeEach(() => {
        mockLogin.mockReset().mockResolvedValue({})
        mockLogout.mockReset().mockResolvedValue({})
        mockTrustedAgentState = {isAgent: false, agentId: '', loginId: ''}
    })

    test('renders the heading and template name', () => {
        renderWithProviders(<TrustedAgent />)

        expect(screen.getByTestId('trusted-agent-page-heading')).toBeInTheDocument()
        expect(typeof TrustedAgent.getTemplateName()).toBe('string')
    })

    test('logs in as agent with the entered login id', async () => {
        renderWithProviders(<TrustedAgent />)

        fireEvent.change(screen.getByTestId('trusted-agent-login-id'), {
            target: {value: 'shopper@example.com'}
        })
        fireEvent.click(screen.getByTestId('trusted-agent-login-button'))

        await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('shopper@example.com'))
    })

    test('surfaces the error message when login fails', async () => {
        mockLogin.mockRejectedValue(new Error('Missing trusted agent scope'))
        renderWithProviders(<TrustedAgent />)

        fireEvent.click(screen.getByTestId('trusted-agent-login-button'))

        const error = await screen.findByTestId('trusted-agent-error')
        expect(error).toHaveTextContent('Missing trusted agent scope')
    })

    test('shows agent session state when an agent is logged in', () => {
        mockTrustedAgentState = {
            isAgent: true,
            agentId: 'agent-007',
            loginId: 'shopper@example.com'
        }
        renderWithProviders(<TrustedAgent />)

        expect(screen.getByTestId('trusted-agent-is-agent')).toHaveTextContent('active')
        expect(screen.getByTestId('trusted-agent-agent-id')).toHaveTextContent('agent-007')
        expect(screen.getByTestId('trusted-agent-login-id-value')).toHaveTextContent(
            'shopper@example.com'
        )
    })
})
