/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import ShopperAgentWelcomeMessage from './welcome-message'

const message = 'Hi! Welcome to our store. Looking for holiday gift inspiration?'
const props = {
    siteId: 'RefArch',
    message,
    dismissLabel: 'Dismiss welcome message',
    onOpen: jest.fn(),
    onDismiss: jest.fn()
}

describe('ShopperAgentWelcomeMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        window.localStorage.clear()
    })

    test('shows on the first visit and stays hidden after remount', () => {
        const {unmount} = render(<ShopperAgentWelcomeMessage {...props} />)
        expect(screen.getByRole('button', {name: message})).toBeInTheDocument()
        unmount()
        render(<ShopperAgentWelcomeMessage {...props} />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })

    test('opens chat when the greeting is clicked', () => {
        render(<ShopperAgentWelcomeMessage {...props} />)
        fireEvent.click(screen.getByRole('button', {name: message}))
        expect(props.onOpen).toHaveBeenCalledTimes(1)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })

    test('demo mode ignores the previous visit and does not reappear after dismissal on this page', () => {
        const siteId = 'DemoStore'
        window.localStorage.setItem(`pwa-kit:shopper-agent:welcome:${siteId}:v1`, 'shown')
        const {unmount} = render(<ShopperAgentWelcomeMessage {...props} siteId={siteId} demoMode />)
        expect(screen.getByRole('button', {name: message})).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', {name: props.dismissLabel}))
        unmount()
        render(<ShopperAgentWelcomeMessage {...props} siteId={siteId} demoMode />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })

    test('dismisses without opening chat', () => {
        render(<ShopperAgentWelcomeMessage {...props} />)
        fireEvent.click(screen.getByRole('button', {name: props.dismissLabel}))
        expect(props.onOpen).not.toHaveBeenCalled()
        expect(props.onDismiss).toHaveBeenCalledTimes(1)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })

    test('keeps first-visit state separate for different storefronts', () => {
        const {unmount} = render(<ShopperAgentWelcomeMessage {...props} />)
        unmount()
        render(<ShopperAgentWelcomeMessage {...props} siteId="AnotherStore" />)
        expect(screen.getByRole('button', {name: message})).toBeInTheDocument()
    })

    test('docks beside a left-positioned launcher', () => {
        render(<ShopperAgentWelcomeMessage {...props} position="bottom-left" />)
        expect(screen.getByTestId('shopper-agent-welcome')).toHaveStyle({left: '92px'})
    })

    test('stays hidden when reading browser storage is blocked', () => {
        jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
            throw new Error('Storage blocked')
        })
        render(<ShopperAgentWelcomeMessage {...props} />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        jest.restoreAllMocks()
    })

    test('stays hidden when writing browser storage fails', () => {
        jest.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
            throw new Error('Storage full')
        })
        render(<ShopperAgentWelcomeMessage {...props} />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        jest.restoreAllMocks()
    })

    test('still shows on a first visit in React StrictMode', () => {
        render(
            <React.StrictMode>
                <ShopperAgentWelcomeMessage {...props} />
            </React.StrictMode>
        )
        expect(screen.getByRole('button', {name: message})).toBeInTheDocument()
    })
})
