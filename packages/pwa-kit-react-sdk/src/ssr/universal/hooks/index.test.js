/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useBlockNavigation} from './index'
import React, {act} from 'react'
import {render} from '@testing-library/react'

const mockUnblock = jest.fn()
const mockBlock = jest.fn().mockImplementation((someFunc) => {
    someFunc({action: jest.fn(), location: 'another place'})

    return mockUnblock
})
const mockFunc = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        block: mockBlock,
        push: jest.fn(),
        location: 'some location'
    })
}))

const AComponent = () => {
    useBlockNavigation(mockFunc)
    return <></>
}

describe('useBlockNavigation', () => {
    beforeEach(() => {
        mockFunc.mockReset()
    })

    it('should block when function returns true', async () => {
        mockFunc.mockResolvedValueOnce(true)
        await act(async () => {
            render(<AComponent />)
        })
        expect(mockFunc).toHaveBeenCalled()
        expect(mockBlock).toHaveBeenCalled()
    })

    it('should not block when function returns false', async () => {
        mockFunc.mockResolvedValue(false)
        await act(async () => {
            render(<AComponent />)
        })

        expect(mockFunc).toHaveBeenCalled()
        expect(mockBlock).toHaveBeenCalled()
        expect(mockUnblock).toHaveBeenCalled()
    })
})
