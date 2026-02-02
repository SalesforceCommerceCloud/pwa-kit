/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, screen, act} from '@testing-library/react'
import {fireEvent} from '@testing-library/react'
import {useCountdown} from '@salesforce/retail-react-app/app/hooks/use-countdown'

const TestComponent = ({initial = 0}) => {
    const [count, setCount] = useCountdown(initial)
    return (
        <div>
            <span data-testid="count">{count}</span>
            <button onClick={() => setCount(5)}>start-5</button>
            <button onClick={() => setCount(0)}>stop</button>
        </div>
    )
}

TestComponent.propTypes = {
    initial: PropTypes.number
}

describe('useCountdown', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    test('initializes with provided initial value', () => {
        render(<TestComponent initial={3} />)
        expect(screen.getByTestId('count').textContent).toBe('3')
    })

    test('counts down to zero at 1s intervals once started', () => {
        render(<TestComponent initial={0} />)

        // Start countdown at 5
        fireEvent.click(screen.getByText('start-5'))
        expect(screen.getByTestId('count').textContent).toBe('5')

        for (let expected = 4; expected >= 0; expected--) {
            act(() => {
                jest.advanceTimersByTime(1000)
            })
            expect(screen.getByTestId('count').textContent).toBe(String(expected))
        }

        // stays at 0 (no negative counts)
        act(() => {
            jest.advanceTimersByTime(2000)
        })
        expect(screen.getByTestId('count').textContent).toBe('0')
    })

    test('can be stopped manually by setting to 0', () => {
        render(<TestComponent initial={0} />)

        fireEvent.click(screen.getByText('start-5'))
        expect(screen.getByTestId('count').textContent).toBe('5')

        // advance 1 second to 4
        act(() => {
            jest.advanceTimersByTime(1000)
        })
        expect(screen.getByTestId('count').textContent).toBe('4')

        // stop and verify it remains at 0
        fireEvent.click(screen.getByText('stop'))
        expect(screen.getByTestId('count').textContent).toBe('0')

        act(() => {
            jest.advanceTimersByTime(2000)
        })
        expect(screen.getByTestId('count').textContent).toBe('0')
    })
})
