/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, fireEvent, waitFor} from '@testing-library/react'
import {act} from 'react-dom/test-utils'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CommerceClientFab from '@salesforce/retail-react-app/app/components/shopper-agent/commerce-client-fab'
import {
    COMMERCE_CLIENT_OPEN_STATE_KEY,
    COMMERCE_CLIENT_UI_STATE_EVENT
} from '@salesforce/retail-react-app/app/constants'

import {AddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

const mockToggleWidgetOpen = jest.fn()

describe('CommerceClientFab', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        window.localStorage.clear()
        window.CimulateMessaging = {
            eventHandlers: {components: {toggleWidgetOpen: mockToggleWidgetOpen}}
        }
    })

    afterEach(() => {
        delete window.CimulateMessaging
        window.sessionStorage.removeItem(COMMERCE_CLIENT_OPEN_STATE_KEY)
    })

    test('defers the nudge until the add-to-cart modal closes without consuming its first view', async () => {
        const view = (isOpen) => (
            <AddToCartModalContext.Provider value={{isOpen}}>
                <CommerceClientFab siteId="modal-test" />
            </AddToCartModalContext.Provider>
        )
        let setOpen
        const ModalState = () => {
            const [isOpen, setIsOpen] = React.useState(true)
            setOpen = setIsOpen
            return view(isOpen)
        }
        renderWithProviders(<ModalState />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        expect(screen.queryByTestId('commerce-client-fab')).not.toBeInTheDocument()
        expect(
            window.localStorage.getItem('pwa-kit:shopper-agent:welcome:modal-test:v1')
        ).toBeNull()
        act(() => setOpen(false))
        // The modal backdrop is still fading out.
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        await waitFor(() => expect(screen.getByTestId('shopper-agent-welcome')).toBeInTheDocument())
        expect(screen.getByTestId('commerce-client-fab')).toBeInTheDocument()
    })

    test('restores an unhandled demo nudge that appeared just before the mini-cart opened', async () => {
        let setOpen
        const ModalState = () => {
            const [isOpen, setIsOpen] = React.useState(false)
            setOpen = setIsOpen
            return (
                <AddToCartModalContext.Provider value={{isOpen}}>
                    <CommerceClientFab siteId="modal-race-demo" welcomeMessageDemoMode />
                </AddToCartModalContext.Provider>
            )
        }
        renderWithProviders(<ModalState />)
        expect(screen.getByTestId('shopper-agent-welcome')).toBeInTheDocument()
        act(() => setOpen(true))
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        act(() => setOpen(false))
        await waitFor(() => expect(screen.getByTestId('shopper-agent-welcome')).toBeInTheDocument())
        fireEvent.click(screen.getByRole('button', {name: 'Dismiss welcome message'}))
        act(() => setOpen(true))
        act(() => setOpen(false))
        await waitFor(() => expect(screen.getByTestId('commerce-client-fab')).toBeInTheDocument())
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })

    test('opens the Commerce Client widget when clicked', () => {
        renderWithProviders(<CommerceClientFab />)

        fireEvent.click(screen.getByTestId('commerce-client-fab'))

        expect(mockToggleWidgetOpen).toHaveBeenCalledWith(true)
    })

    test('docks to the right corner by default', () => {
        renderWithProviders(<CommerceClientFab />)

        expect(screen.getByTestId('commerce-client-fab')).toHaveStyle({
            position: 'fixed',
            right: 'var(--chakra-space-6)'
        })
    })

    test('docks to the left corner when position is bottom-left', () => {
        renderWithProviders(<CommerceClientFab position="bottom-left" />)

        expect(screen.getByTestId('commerce-client-fab')).toHaveStyle({
            left: 'var(--chakra-space-6)'
        })
    })

    test('portals the FAB after preceding content so the skip link keeps first focus', () => {
        renderWithProviders(
            <>
                <a href="#app-main" data-testid="skip-link">
                    Skip to Content
                </a>
                <CommerceClientFab />
            </>
        )

        const skipLink = screen.getByTestId('skip-link')
        const fab = screen.getByTestId('commerce-client-fab')

        // Portaled to the end of <body>, so the FAB follows the skip link in DOM/tab order.

        expect(
            skipLink.compareDocumentPosition(fab) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
    })

    test('hides while the agent panel is open', () => {
        renderWithProviders(<CommerceClientFab isPanelOpenByDefault={true} />)

        expect(screen.queryByTestId('commerce-client-fab')).toBeNull()
    })

    test('hides and reappears as the widget reports its open-state', () => {
        renderWithProviders(<CommerceClientFab />)

        expect(screen.getByTestId('commerce-client-fab')).toBeInTheDocument()

        act(() => {
            window.dispatchEvent(
                new CustomEvent(COMMERCE_CLIENT_UI_STATE_EVENT, {
                    detail: {property: 'isOpen', value: true}
                })
            )
        })
        expect(screen.queryByTestId('commerce-client-fab')).toBeNull()

        act(() => {
            window.dispatchEvent(
                new CustomEvent(COMMERCE_CLIENT_UI_STATE_EVENT, {
                    detail: {property: 'isOpen', value: false}
                })
            )
        })
        expect(screen.getByTestId('commerce-client-fab')).toBeInTheDocument()
    })

    test('stays hidden after navigating with the panel left open', () => {
        window.sessionStorage.setItem(COMMERCE_CLIENT_OPEN_STATE_KEY, 'true')

        renderWithProviders(<CommerceClientFab />)

        expect(screen.queryByTestId('commerce-client-fab')).toBeNull()
    })

    test('shows the welcome nudge by default and opens the widget when clicked', () => {
        renderWithProviders(<CommerceClientFab siteId="RefArch" />)
        fireEvent.click(screen.getByRole('button', {name: /holiday gift inspiration/}))
        expect(mockToggleWidgetOpen).toHaveBeenCalledWith(true)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })

    test('honors the merchant opt-out without hiding the launcher', () => {
        renderWithProviders(<CommerceClientFab welcomeMessageEnabled="false" />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        expect(screen.getByTestId('commerce-client-fab')).toBeInTheDocument()
    })

    test('uses the merchant greeting and returns focus to the launcher on dismissal', () => {
        renderWithProviders(<CommerceClientFab welcomeMessage="Welcome to Vineyard Vines!" />)
        expect(screen.getByRole('button', {name: 'Welcome to Vineyard Vines!'})).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', {name: 'Dismiss welcome message'}))
        expect(screen.getByTestId('commerce-client-fab')).toHaveFocus()
        expect(mockToggleWidgetOpen).not.toHaveBeenCalled()
    })

    test('does not consume the first-visit greeting when restoring an open panel', () => {
        window.sessionStorage.setItem(COMMERCE_CLIENT_OPEN_STATE_KEY, 'true')
        renderWithProviders(<CommerceClientFab siteId="RefArch" />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
        expect(window.localStorage.getItem('pwa-kit:shopper-agent:welcome:RefArch:v1')).toBeNull()
    })

    test('does not display an empty greeting', () => {
        renderWithProviders(<CommerceClientFab welcomeMessage="   " />)
        expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    })
})
