/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useShopperAgent} from '@salesforce/retail-react-app/app/hooks/use-shopper-agent'
import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

jest.mock('@salesforce/retail-react-app/app/utils/shopper-agent-utils', () => ({
    openShopperAgentWidget: jest.fn()
}))

describe('useShopperAgent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return an object with actions', () => {
        const {result} = renderHook(() => useShopperAgent())

        expect(result.current).toEqual({actions: expect.any(Object)})
        expect(result.current.actions).toHaveProperty('open')
        expect(typeof result.current.actions.open).toBe('function')
    })

    test('should call openShopperAgentWidget when actions.open is invoked', () => {
        const {result} = renderHook(() => useShopperAgent())

        act(() => {
            result.current.actions.open()
        })

        expect(openShopperAgentWidget).toHaveBeenCalledTimes(1)
    })

    test('should call openShopperAgentWidget each time actions.open is invoked', () => {
        const {result} = renderHook(() => useShopperAgent())

        act(() => {
            result.current.actions.open()
            result.current.actions.open()
        })

        expect(openShopperAgentWidget).toHaveBeenCalledTimes(2)
    })

    test('should return a stable open callback reference across re-renders', () => {
        const {result, rerender} = renderHook(() => useShopperAgent())

        const firstOpen = result.current.actions.open
        rerender()
        const secondOpen = result.current.actions.open

        expect(firstOpen).toBe(secondOpen)
    })
})
