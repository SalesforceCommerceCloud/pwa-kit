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
        jest.useFakeTimers()
        jest.clearAllMocks()
        window.CimulateMessaging = {
            eventHandlers: {components: {toggleWidgetOpen: mockToggleWidgetOpen}}
        }
    })

    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
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

    test('resumes animation cycle after panel close even if hover was interrupted', () => {
        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')

        // Hover the FAB (sets interactingRef = true)
        act(() => {
            fireEvent.mouseEnter(fab)
        })

        // Panel opens — FAB disappears without mouseLeave firing
        act(() => {
            window.dispatchEvent(
                new CustomEvent(COMMERCE_CLIENT_UI_STATE_EVENT, {
                    detail: {property: 'isOpen', value: true}
                })
            )
        })
        expect(screen.queryByTestId('commerce-client-fab')).toBeNull()

        // Panel closes — FAB reappears
        act(() => {
            window.dispatchEvent(
                new CustomEvent(COMMERCE_CLIENT_UI_STATE_EVENT, {
                    detail: {property: 'isOpen', value: false}
                })
            )
        })

        const reappeared = screen.getByTestId('commerce-client-fab')
        expect(reappeared).toHaveStyle({maxWidth: '320px'})

        // Should still collapse after 1s (interactingRef was reset)
        act(() => jest.advanceTimersByTime(1000))
        expect(reappeared).toHaveStyle({maxWidth: '56px'})
    })

    test('stays hidden after navigating with the panel left open', () => {
        window.sessionStorage.setItem(COMMERCE_CLIENT_OPEN_STATE_KEY, 'true')

        renderWithProviders(<CommerceClientFab />)

        expect(screen.queryByTestId('commerce-client-fab')).toBeNull()
    })

    test('displays label text from default intl message', () => {
        renderWithProviders(<CommerceClientFab />)

        expect(screen.getByTestId('commerce-client-fab-label')).toHaveTextContent(
            'Ask Shopping Agent'
        )
    })

    test('displays custom fabLabel when provided', () => {
        renderWithProviders(<CommerceClientFab fabLabel="gear up for adventure" />)

        expect(screen.getByTestId('commerce-client-fab-label')).toHaveTextContent(
            'gear up for adventure'
        )
    })

    test('uses custom ariaLabel when provided', () => {
        renderWithProviders(<CommerceClientFab ariaLabel="Open assistant" />)

        expect(screen.getByLabelText('Open assistant')).toBeInTheDocument()
    })

    test('uses label as aria-label when ariaLabel is not provided', () => {
        renderWithProviders(<CommerceClientFab />)

        expect(screen.getByLabelText('Ask Shopping Agent')).toBeInTheDocument()
    })

    test('starts expanded then collapses after 1 second', () => {
        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')
        expect(fab).toHaveStyle({maxWidth: '320px'})

        act(() => jest.advanceTimersByTime(1000))

        expect(fab).toHaveStyle({maxWidth: '56px'})
    })

    test('re-expands after the collapsed interval', () => {
        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')

        // Collapse at 1s
        act(() => jest.advanceTimersByTime(1000))
        expect(fab).toHaveStyle({maxWidth: '56px'})

        // Re-expand at 1s + 5.2s = 6.2s
        act(() => jest.advanceTimersByTime(5200))
        expect(fab).toHaveStyle({maxWidth: '320px'})
    })

    test('shows sheen sweep during the animation cycle', () => {
        renderWithProviders(<CommerceClientFab />)

        // No sheen initially
        expect(screen.queryByTestId('commerce-client-fab-sheen')).toBeNull()

        // Sheen at 1s + 6s = 7s
        act(() => jest.advanceTimersByTime(7000))
        expect(screen.getByTestId('commerce-client-fab-sheen')).toBeInTheDocument()
    })

    test('holds FAB open on hover and resumes cycle on leave', () => {
        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')

        // Collapse at 1s
        act(() => jest.advanceTimersByTime(1000))
        expect(fab).toHaveStyle({maxWidth: '56px'})

        // Hover re-expands
        act(() => {
            fireEvent.mouseEnter(fab)
        })
        expect(fab).toHaveStyle({maxWidth: '320px'})

        // Leave resumes closed cycle
        act(() => {
            fireEvent.mouseLeave(fab)
        })
        expect(fab).toHaveStyle({maxWidth: '56px'})
    })

    test('holds FAB open on focus and resumes cycle on blur', () => {
        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')

        act(() => jest.advanceTimersByTime(1000))
        expect(fab).toHaveStyle({maxWidth: '56px'})

        act(() => {
            fireEvent.focus(fab)
        })
        expect(fab).toHaveStyle({maxWidth: '320px'})

        act(() => {
            fireEvent.blur(fab)
        })
        expect(fab).toHaveStyle({maxWidth: '56px'})
    })

    test('stays expanded permanently when prefers-reduced-motion is enabled', () => {
        const originalMatchMedia = window.matchMedia
        window.matchMedia = jest.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        }))

        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')
        expect(fab).toHaveStyle({maxWidth: '320px'})

        // Should stay expanded even after the normal collapse time
        act(() => jest.advanceTimersByTime(5000))
        expect(fab).toHaveStyle({maxWidth: '320px'})

        window.matchMedia = originalMatchMedia
    })

    test('loops the animation cycle', () => {
        renderWithProviders(<CommerceClientFab />)

        const fab = screen.getByTestId('commerce-client-fab')

        // Full cycle: 1s collapse + 7.1s closed cycle = 8.1s
        act(() => jest.advanceTimersByTime(8100))

        // Should be expanded again (loop restarted)
        expect(fab).toHaveStyle({maxWidth: '320px'})

        // Collapses again at +1s
        act(() => jest.advanceTimersByTime(1000))
        expect(fab).toHaveStyle({maxWidth: '56px'})
    })
})
