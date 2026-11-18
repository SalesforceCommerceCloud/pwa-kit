/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {
    CC_HEADER_ID,
    useCommerceClientPanelPosition
} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-panel-position'

let resizeObserverInstance
let mutationObserverInstance

class MockResizeObserver {
    constructor(callback) {
        this._callback = callback
        resizeObserverInstance = this // eslint-disable-line @typescript-eslint/no-this-alias
    }
    observe = jest.fn()
    disconnect = jest.fn()
}

class MockMutationObserver {
    constructor(callback) {
        this._callback = callback
        mutationObserverInstance = this // eslint-disable-line @typescript-eslint/no-this-alias
    }
    observe = jest.fn()
    disconnect = jest.fn()
}

describe('useCommerceClientPanelPosition', () => {
    const OriginalResizeObserver = global.ResizeObserver
    const OriginalMutationObserver = global.MutationObserver
    let headerEl

    beforeEach(() => {
        global.ResizeObserver = MockResizeObserver
        global.MutationObserver = MockMutationObserver
        resizeObserverInstance = null
        mutationObserverInstance = null

        headerEl = document.createElement('div')
        headerEl.id = CC_HEADER_ID
        jest.spyOn(headerEl, 'getBoundingClientRect').mockReturnValue({height: 64, bottom: 64})
        document.body.appendChild(headerEl)
    })

    afterEach(() => {
        global.ResizeObserver = OriginalResizeObserver
        global.MutationObserver = OriginalMutationObserver
        headerEl.remove()
        document.documentElement.style.removeProperty('--cc-panel-top')
    })

    test('sets --cc-panel-top from header bottom position', () => {
        renderHook(() => useCommerceClientPanelPosition(true))

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('64px')
    })

    test('observes header for resize and mutations', () => {
        renderHook(() => useCommerceClientPanelPosition(true))

        expect(resizeObserverInstance.observe).toHaveBeenCalledWith(headerEl)
        expect(mutationObserverInstance.observe).toHaveBeenCalledWith(headerEl, {
            childList: true,
            subtree: true,
            attributes: true
        })
    })

    test('does not set properties when inactive', () => {
        renderHook(() => useCommerceClientPanelPosition(false))

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('')
    })

    test('does not set properties when header element is missing', () => {
        headerEl.remove()

        renderHook(() => useCommerceClientPanelPosition(true))

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('')
    })

    test('cleans up properties on unmount', () => {
        const {unmount} = renderHook(() => useCommerceClientPanelPosition(true))

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('64px')

        unmount()

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('')
    })

    test('disconnects observers on unmount', () => {
        const {unmount} = renderHook(() => useCommerceClientPanelPosition(true))

        unmount()

        expect(resizeObserverInstance.disconnect).toHaveBeenCalled()
        expect(mutationObserverInstance.disconnect).toHaveBeenCalled()
    })

    test('accounts for inner element box-shadow extent', () => {
        const inner = document.createElement('div')
        headerEl.appendChild(inner)
        inner.style.boxShadow =
            'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px'

        renderHook(() => useCommerceClientPanelPosition(true))

        // offset-y(1) + blur(3) + spread(0) = 4
        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('68px')
    })

    test('removes properties when deactivated', () => {
        const {rerender} = renderHook(({active}) => useCommerceClientPanelPosition(active), {
            initialProps: {active: true}
        })

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('64px')

        rerender({active: false})

        expect(document.documentElement.style.getPropertyValue('--cc-panel-top')).toBe('')
    })
})
