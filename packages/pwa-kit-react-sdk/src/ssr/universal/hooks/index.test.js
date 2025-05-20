/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, act, waitFor} from '@testing-library/react'
import {useBlockNavigation} from './index'

// Mocks for react-router-dom's useHistory
const mockUnblock = jest.fn()
const mockPush = jest.fn()
let blockCallback

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        block: jest.fn((cb) => {
            blockCallback = cb
            return mockUnblock
        }),
        push: mockPush,
        location: {pathname: '/initial'}
    })
}))

const TestComponent = ({callback}) => {
    const {isBlocked} = useBlockNavigation(callback)
    return <div data-testid="is-blocked">{isBlocked ? 'blocked' : 'not-blocked'}</div>
}
TestComponent.propTypes = {
    callback: PropTypes.func.isRequired
}

describe('useBlockNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        blockCallback = undefined
    })

    it('should call the callback and push navigation after callback resolves', async () => {
        const callback = jest.fn().mockResolvedValue(undefined)
        render(<TestComponent callback={callback} />)

        // Simulate navigation to a new location
        await act(async () => {
            await blockCallback({pathname: '/new-path'}, 'PUSH')
        })

        // The callback should have been called with the new location and action
        expect(callback).toHaveBeenCalledWith({pathname: '/new-path'}, 'PUSH')

        // Wait for the push to be called after the callback resolves
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/new-path')
        })

        // The unblock function should NOT be called unless the component unmounts
        expect(mockUnblock).not.toHaveBeenCalled()
    })

    it('should set isBlocked to false after navigation', async () => {
        const callback = jest.fn().mockResolvedValue(undefined)
        const {getByTestId} = render(<TestComponent callback={callback} />)

        // Simulate navigation
        await act(async () => {
            await blockCallback({pathname: '/another-path'}, 'PUSH')
        })

        // After navigation, isBlocked should be false
        expect(getByTestId('is-blocked').textContent).toBe('not-blocked')
        expect(callback).toHaveBeenCalledWith({pathname: '/another-path'}, 'PUSH')
    })

    it('should show blocked then not-blocked in sequence', async () => {
        const callback = jest.fn(() => new Promise((res) => setTimeout(res, 50)))
        const {getByTestId} = render(<TestComponent callback={callback} />)

        await act(async () => {
            blockCallback({pathname: '/delayed-path'}, 'PUSH')
        })

        // Wait for it to show "blocked"
        await waitFor(() => {
            expect(getByTestId('is-blocked').textContent).toBe('blocked')
        })

        // Then wait for it to flip back
        await waitFor(() => {
            expect(getByTestId('is-blocked').textContent).toBe('not-blocked')
        })
    })
})
