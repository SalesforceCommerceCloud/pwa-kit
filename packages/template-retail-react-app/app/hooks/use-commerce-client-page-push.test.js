/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act, renderHook} from '@testing-library/react'
import {useCommerceClientPagePush} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-page-push'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'
import {getPersistedCommerceClientOpenState} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

jest.mock('@salesforce/retail-react-app/app/utils/shopper-agent-utils', () => ({
    getPersistedCommerceClientOpenState: jest.fn()
}))

beforeEach(() => {
    // Default: nothing persisted, so the hook falls back to the cc_isOpen default.
    getPersistedCommerceClientOpenState.mockReturnValue(undefined)
})

afterEach(() => {
    jest.clearAllMocks()
})

// Base config that satisfies every gate: agent on, Commerce Client provider,
// page-push on, full-height dialog. Individual tests override fields to exercise
// the gates.
const enabledConfig = {
    enabled: 'true',
    provider: 'commerce-client',
    cc_pagePush: 'true',
    cc_displayType: 'dialog',
    cc_dialogFullHeight: 'true',
    cc_widgetPosition: 'bottom-right',
    cc_dialogWidth: '420px',
    cc_isOpen: 'false'
}

// Fire the widget's UI-state-update event the way the Cimulate bundle does.
const dispatchUiState = (property, value) => {
    act(() => {
        window.dispatchEvent(
            new CustomEvent(COMMERCE_CLIENT_UI_STATE_EVENT, {detail: {property, value}})
        )
    })
}

describe('useCommerceClientPagePush', () => {
    describe('gating', () => {
        test('returns no padding props when page-push is disabled by default config', () => {
            const {result} = renderHook(() => useCommerceClientPagePush({}))
            expect(result.current).toEqual({})
        })

        test('returns no props when cc_pagePush is not "true"', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_pagePush: 'false'})
            )
            expect(result.current).toEqual({})
        })

        test('returns no props for the miaw provider', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, provider: 'miaw'})
            )
            expect(result.current).toEqual({})
        })

        test('returns no props when the widget is not a full-height side panel', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_dialogFullHeight: 'false'})
            )
            expect(result.current).toEqual({})
        })

        test('returns no props when the shopper agent is disabled', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, enabled: 'false'})
            )
            expect(result.current).toEqual({})
        })

        test('returns no props for a modal widget', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_displayType: 'modal'})
            )
            expect(result.current).toEqual({})
        })

        test('returns no props for an inline chat widget', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_displayType: 'chat'})
            )
            expect(result.current).toEqual({})
        })

        test('applies the shift when cc_displayType is left at its dialog default', () => {
            const configWithoutDisplayType = {...enabledConfig}
            delete configWithoutDisplayType.cc_displayType

            const {result} = renderHook(() => useCommerceClientPagePush(configWithoutDisplayType))

            dispatchUiState('isOpen', true)

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
        })

        test('ignores widget events while page-push is gated off', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_displayType: 'modal'})
            )

            dispatchUiState('isOpen', true)

            expect(result.current).toEqual({})
        })
    })

    describe('when enabled', () => {
        test('applies no shift while the panel is closed', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            expect(result.current).toEqual({
                paddingRight: 0,
                transition: 'padding 0.3s ease-in-out'
            })
        })

        test('seeds the shift from cc_isOpen so the push is applied on first paint', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_isOpen: 'true'})
            )

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
        })

        test('restores the shift from a persisted open-state after navigation', () => {
            // Shopper left the panel open, then clicked an in-panel result and navigated.
            getPersistedCommerceClientOpenState.mockReturnValue(true)

            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
        })

        test('persisted closed-state overrides a cc_isOpen default of true', () => {
            // Shopper closed the panel; it must stay closed even though cc_isOpen is true.
            getPersistedCommerceClientOpenState.mockReturnValue(false)

            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_isOpen: 'true'})
            )

            expect(result.current.paddingRight).toBe(0)
        })

        test('shifts content on the docked side when the panel opens', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isOpen', true)

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
        })

        test('removes the shift when the panel closes (e.g. the widget X button)', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_isOpen: 'true'})
            )

            dispatchUiState('isOpen', false)

            expect(result.current.paddingRight).toBe(0)
        })

        test('pushes from the left when the widget docks bottom-left', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_widgetPosition: 'bottom-left'})
            )

            dispatchUiState('isOpen', true)

            expect(result.current).toEqual({
                paddingLeft: {base: 0, lg: '420px'},
                transition: 'padding 0.3s ease-in-out'
            })
            expect(result.current).not.toHaveProperty('paddingRight')
        })

        test('follows the panel when the shopper moves it to the other side', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isOpen', true)
            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})

            dispatchUiState('position', 'bottom-left')

            expect(result.current).toEqual({
                paddingLeft: {base: 0, lg: '420px'},
                transition: 'padding 0.3s ease-in-out'
            })
            expect(result.current).not.toHaveProperty('paddingRight')
        })

        test('moves the shift back when the panel returns to the configured corner', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_widgetPosition: 'bottom-left'})
            )

            dispatchUiState('isOpen', true)
            dispatchUiState('position', 'bottom-right')

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
            expect(result.current).not.toHaveProperty('paddingLeft')
        })

        test('keeps the panel side across an open/close cycle', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('position', 'bottom-left')
            dispatchUiState('isOpen', true)
            dispatchUiState('isOpen', false)
            dispatchUiState('isOpen', true)

            expect(result.current.paddingLeft).toEqual({base: 0, lg: '420px'})
        })

        test('falls back to the right-hand shift for positions we do not push against', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_widgetPosition: 'bottom-left'})
            )

            dispatchUiState('isOpen', true)
            dispatchUiState('position', 'center')

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
            expect(result.current).not.toHaveProperty('paddingLeft')
        })

        test('ignores a non-string position value', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_widgetPosition: 'bottom-left'})
            )

            dispatchUiState('isOpen', true)
            dispatchUiState('position', undefined)

            expect(result.current.paddingLeft).toEqual({base: 0, lg: '420px'})
        })

        test('honors a custom cc_dialogWidth for the shift amount', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_dialogWidth: '520px'})
            )

            dispatchUiState('isOpen', true)

            expect(result.current.paddingRight).toEqual({base: 0, lg: '520px'})
        })

        test('drops the shift while the shopper expands the panel into a modal', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isOpen', true)
            dispatchUiState('type', 'modal')

            expect(result.current.paddingRight).toBe(0)
        })

        test('restores the shift when the expanded panel is docked again', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isOpen', true)
            dispatchUiState('type', 'modal')
            dispatchUiState('type', 'dialog')

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
        })

        test('keeps the shift off when an expanded panel is closed and reopened', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isOpen', true)
            dispatchUiState('type', 'modal')
            dispatchUiState('isOpen', false)
            dispatchUiState('isOpen', true)

            expect(result.current.paddingRight).toBe(0)
        })

        test('ignores a non-string widget type value', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isOpen', true)
            dispatchUiState('type', undefined)

            expect(result.current.paddingRight).toEqual({base: 0, lg: '420px'})
        })

        test('ignores UI-state-update events for other properties', () => {
            const {result} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            dispatchUiState('isMinimized', true)

            expect(result.current.paddingRight).toBe(0)
        })

        test('stops reacting to events after unmount', () => {
            const {result, unmount} = renderHook(() => useCommerceClientPagePush(enabledConfig))

            unmount()
            dispatchUiState('isOpen', true)

            // The last rendered value (closed) stands; no update after unmount.
            expect(result.current.paddingRight).toBe(0)
        })
    })
})
