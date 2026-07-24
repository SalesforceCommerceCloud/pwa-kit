/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act, renderHook} from '@testing-library/react'
import {useCommerceClientPagePush} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-page-push'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'

// Base config that satisfies every gate: Commerce Client provider, page-push on,
// full-height side panel. Individual tests override fields to exercise the gates.
const enabledConfig = {
    provider: 'commerce-client',
    cc_pagePush: 'true',
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

        test('honors a custom cc_dialogWidth for the shift amount', () => {
            const {result} = renderHook(() =>
                useCommerceClientPagePush({...enabledConfig, cc_dialogWidth: '520px'})
            )

            dispatchUiState('isOpen', true)

            expect(result.current.paddingRight).toEqual({base: 0, lg: '520px'})
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
