/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {
    useFeedbackState,
    ANNOUNCE_DELAY_MS
} from '@salesforce/retail-react-app/app/pages/account/hooks/use-feedback-state'

describe('useFeedbackState', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })
    afterEach(() => {
        jest.runOnlyPendingTimers()
        jest.useRealTimers()
    })

    test('starts with null feedback', () => {
        const {result} = renderHook(() => useFeedbackState())
        expect(result.current.feedback).toBeNull()
    })

    test('setFeedback updates feedback immediately (no delay)', () => {
        const {result} = renderHook(() => useFeedbackState())
        act(() => {
            result.current.setFeedback({status: 'error', title: 'Oops'})
        })
        expect(result.current.feedback).toEqual({status: 'error', title: 'Oops'})
    })

    test('announce runs the producer only after the delay elapses', () => {
        const {result} = renderHook(() => useFeedbackState())
        const producer = jest.fn()
        act(() => {
            result.current.announce(producer)
        })
        // Not yet — the timer is pending.
        expect(producer).not.toHaveBeenCalled()
        act(() => {
            jest.advanceTimersByTime(ANNOUNCE_DELAY_MS)
        })
        expect(producer).toHaveBeenCalledTimes(1)
    })

    test('announce honors a custom delay', () => {
        const {result} = renderHook(() => useFeedbackState(1000))
        const producer = jest.fn()
        act(() => {
            result.current.announce(producer)
        })
        act(() => {
            jest.advanceTimersByTime(ANNOUNCE_DELAY_MS)
        })
        expect(producer).not.toHaveBeenCalled()
        act(() => {
            jest.advanceTimersByTime(1000 - ANNOUNCE_DELAY_MS)
        })
        expect(producer).toHaveBeenCalledTimes(1)
    })

    test('a second announce cancels the first pending producer', () => {
        const {result} = renderHook(() => useFeedbackState())
        const first = jest.fn()
        const second = jest.fn()
        act(() => {
            result.current.announce(first)
        })
        act(() => {
            result.current.announce(second)
        })
        act(() => {
            jest.advanceTimersByTime(ANNOUNCE_DELAY_MS)
        })
        // Only the latest producer fires — the stale one was cleared.
        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    test('clear cancels a pending producer', () => {
        const {result} = renderHook(() => useFeedbackState())
        const producer = jest.fn()
        act(() => {
            result.current.announce(producer)
            result.current.clear()
        })
        act(() => {
            jest.advanceTimersByTime(ANNOUNCE_DELAY_MS)
        })
        expect(producer).not.toHaveBeenCalled()
    })

    test('unmount clears a pending producer so it never fires', () => {
        const {result, unmount} = renderHook(() => useFeedbackState())
        const producer = jest.fn()
        act(() => {
            result.current.announce(producer)
        })
        unmount()
        act(() => {
            jest.advanceTimersByTime(ANNOUNCE_DELAY_MS)
        })
        expect(producer).not.toHaveBeenCalled()
    })
})
