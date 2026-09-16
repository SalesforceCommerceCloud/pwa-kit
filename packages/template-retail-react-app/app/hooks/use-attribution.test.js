/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {useAttribution} from '@salesforce/retail-react-app/app/hooks/use-attribution'
import {
    captureAttribution,
    clearAttribution
} from '@salesforce/retail-react-app/app/utils/attribution-utils'

const config = {app: {commerceAPI: {cookieDomain: '.example.com'}}}

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => config)
}))

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useDNT: jest.fn(() => ({selectedDnt: undefined}))
    }
})

// Spy on the cookie side effects; the write/clear behaviour itself is covered by
// attribution-utils.test.js.
jest.mock('@salesforce/retail-react-app/app/utils/attribution-utils', () => ({
    captureAttribution: jest.fn(),
    clearAttribution: jest.fn()
}))

describe('useAttribution', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('captures first touch when consent is absent (optimistic default)', () => {
        useDNT.mockReturnValue({selectedDnt: undefined})

        renderHook(() => useAttribution())

        expect(captureAttribution).toHaveBeenCalledTimes(1)
        expect(captureAttribution).toHaveBeenCalledWith({cookieDomain: '.example.com'})
        expect(clearAttribution).not.toHaveBeenCalled()
    })

    test('captures first touch when the shopper has accepted tracking', () => {
        useDNT.mockReturnValue({selectedDnt: false})

        renderHook(() => useAttribution())

        expect(captureAttribution).toHaveBeenCalledTimes(1)
        expect(clearAttribution).not.toHaveBeenCalled()
    })

    test('clears the cookie and does not capture when the shopper has opted out (dw_dnt=1)', () => {
        useDNT.mockReturnValue({selectedDnt: true})

        renderHook(() => useAttribution())

        expect(clearAttribution).toHaveBeenCalledTimes(1)
        expect(clearAttribution).toHaveBeenCalledWith({cookieDomain: '.example.com'})
        expect(captureAttribution).not.toHaveBeenCalled()
    })

    test('clears the cookie when the shopper opts out live (SPA consent change)', () => {
        // Reproduces the SPA opt-out flow: the cookie is cleared the instant selectedDnt
        // flips to true, without waiting for a full-page navigation.
        useDNT.mockReturnValue({selectedDnt: false})
        const {rerender} = renderHook(() => useAttribution())

        expect(captureAttribution).toHaveBeenCalledTimes(1)
        expect(clearAttribution).not.toHaveBeenCalled()

        useDNT.mockReturnValue({selectedDnt: true})
        rerender()

        expect(clearAttribution).toHaveBeenCalledTimes(1)
        // No further capture after opt-out.
        expect(captureAttribution).toHaveBeenCalledTimes(1)
    })
})
