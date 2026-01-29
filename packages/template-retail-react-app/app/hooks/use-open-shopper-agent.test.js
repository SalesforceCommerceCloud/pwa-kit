/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useOpenShopperAgent} from '@salesforce/retail-react-app/app/hooks/use-open-shopper-agent'
import {launchChat} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

jest.mock('@salesforce/retail-react-app/app/utils/shopper-agent-utils', () => ({
    launchChat: jest.fn()
}))

describe('useOpenShopperAgent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return a function', () => {
        const {result} = renderHook(() => useOpenShopperAgent())

        expect(result.current).toBeDefined()
        expect(typeof result.current).toBe('function')
    })

    test('should call launchChat when the returned function is invoked', () => {
        const {result} = renderHook(() => useOpenShopperAgent())

        act(() => {
            result.current()
        })

        expect(launchChat).toHaveBeenCalledTimes(1)
    })

    test('should call launchChat each time the returned function is invoked', () => {
        const {result} = renderHook(() => useOpenShopperAgent())

        act(() => {
            result.current()
            result.current()
        })

        expect(launchChat).toHaveBeenCalledTimes(2)
    })
})
