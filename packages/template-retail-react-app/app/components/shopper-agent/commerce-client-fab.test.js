/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import {act} from 'react-dom/test-utils'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CommerceClientFab from '@salesforce/retail-react-app/app/components/shopper-agent/commerce-client-fab'
import {
    COMMERCE_CLIENT_OPEN_STATE_KEY,
    COMMERCE_CLIENT_UI_STATE_EVENT
} from '@salesforce/retail-react-app/app/constants'

const mockToggleWidgetOpen = jest.fn()

describe('CommerceClientFab', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        window.CimulateMessaging = {
            eventHandlers: {components: {toggleWidgetOpen: mockToggleWidgetOpen}}
        }
    })

    afterEach(() => {
        delete window.CimulateMessaging
        window.sessionStorage.removeItem(COMMERCE_CLIENT_OPEN_STATE_KEY)
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
        // eslint-disable-next-line no-bitwise
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
})
